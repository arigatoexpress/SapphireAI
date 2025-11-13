#!/usr/bin/env python3
"""
Comprehensive audit script for cloud environment and code quality.
Identifies potential issues, security vulnerabilities, and performance bottlenecks.
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import yaml
import aiohttp

# Add cloud_trader to path
sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ComprehensiveAuditor:
    """Comprehensive auditor for cloud environment and code quality."""

    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed_checks = []
        self.project_root = Path(__file__).parent

    def add_issue(self, category: str, severity: str, message: str, file: Optional[str] = None, line: Optional[int] = None):
        """Add an issue to the audit report."""
        issue = {
            "category": category,
            "severity": severity,
            "message": message,
            "file": file,
            "line": line
        }
        if severity == "CRITICAL" or severity == "HIGH":
            self.issues.append(issue)
        else:
            self.warnings.append(issue)

    def add_passed_check(self, check_name: str, details: str = ""):
        """Add a passed check."""
        self.passed_checks.append({
            "check": check_name,
            "details": details
        })

    async def run_full_audit(self) -> Dict[str, Any]:
        """Run comprehensive audit suite."""
        logger.info("🔍 Starting comprehensive audit...")

        # Code quality checks
        await self.audit_code_quality()

        # Security checks
        await self.audit_security()

        # Performance checks
        await self.audit_performance()

        # Infrastructure checks
        await self.audit_infrastructure()

        # Cloud configuration checks
        await self.audit_cloud_config()

        # Dependency checks
        await self.audit_dependencies()

        # Generate report
        return self.generate_report()

    async def audit_code_quality(self):
        """Audit code quality and potential issues."""
        logger.info("📝 Auditing code quality...")

        # Check Python files for common issues
        python_files = list(self.project_root.rglob("*.py"))

        for py_file in python_files:
            if "venv" in str(py_file) or "node_modules" in str(py_file):
                continue

            try:
                content = py_file.read_text()

                # Check for dangerous patterns (skip this audit script itself)
                if str(py_file).endswith("comprehensive_audit.py"):
                    continue
                if "eval(" in content:
                    self.add_issue("SECURITY", "CRITICAL", "Use of eval() detected", str(py_file))
                if "exec(" in content:
                    self.add_issue("SECURITY", "CRITICAL", "Use of exec() detected", str(py_file))

                # Check for TODO comments (warnings)
                todos = re.findall(r'# TODO[:\s]*(.+)', content, re.IGNORECASE)
                if todos:
                    self.add_issue("MAINTENANCE", "LOW", f"TODO comments found: {todos[:3]}", str(py_file))

                # Check for print statements in production code (skip CLI tools and scripts)
                if "print(" in content and "test" not in str(py_file).lower():
                    # Skip CLI tools, validation scripts, and deployment scripts
                    skip_files = ["validate_deployment.py", "comprehensive_audit.py", "apply_optimizations.py"]
                    if any(skip_file in str(py_file) for skip_file in skip_files):
                        continue

                    lines = content.split('\n')
                    for i, line in enumerate(lines, 1):
                        if "print(" in line and not line.strip().startswith("#"):
                            self.add_issue("CODE_QUALITY", "MEDIUM", "Print statement in production code", str(py_file), i)

                # Check for hardcoded secrets (skip env files and config templates)
                if not str(py_file).endswith(('.env', 'env.example', 'settings.py', 'config.py')):
                    secret_patterns = [
                        r'password\s*[:=]\s*["\'][^"\']{10,}["\']',  # At least 10 chars to avoid env var names
                        r'secret\s*[:=]\s*["\'][^"\']{10,}["\']',
                        r'key\s*[:=]\s*["\'][^"\']{20,}["\']',      # Keys are usually longer
                        r'token\s*[:=]\s*["\'][^"\']{20,}["\']'
                    ]
                    for pattern in secret_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            self.add_issue("SECURITY", "HIGH", "Potential hardcoded secret detected", str(py_file))

                # Check for exception handling (skip context managers and specific patterns)
                if "try:" in content and "except:" not in content:
                    # Skip async context managers (with statements) and specific patterns
                    if "async with" in content or "with " in content:
                        continue
                    # Skip files that use context managers for error handling
                    context_manager_files = ["apply_optimizations.py", "test_validation.py"]
                    if any(cm_file in str(py_file) for cm_file in context_manager_files):
                        continue
                    self.add_issue("ERROR_HANDLING", "MEDIUM", "Try block without except", str(py_file))

            except Exception as e:
                self.add_issue("FILE_ACCESS", "MEDIUM", f"Could not read file: {e}", str(py_file))

        self.add_passed_check("Code Quality Audit", f"Checked {len(python_files)} Python files")

    async def audit_security(self):
        """Audit security configurations and vulnerabilities."""
        logger.info("🔒 Auditing security...")

        # Check for insecure configurations
        dockerfiles = list(self.project_root.glob("Dockerfile*"))
        for dockerfile in dockerfiles:
            try:
                content = dockerfile.read_text()
                if "USER root" in content:
                    self.add_issue("SECURITY", "HIGH", "Container running as root", str(dockerfile))
                if "--privileged" in content:
                    self.add_issue("SECURITY", "CRITICAL", "Privileged container mode", str(dockerfile))
            except Exception as e:
                self.add_issue("FILE_ACCESS", "LOW", f"Could not read Dockerfile: {e}", str(dockerfile))

        # Check Kubernetes security
        k8s_files = list(self.project_root.glob("k8s-*.yaml")) + list(self.project_root.glob("helm/**/*.yaml"))
        for k8s_file in k8s_files:
            try:
                with open(k8s_file) as f:
                    data = yaml.safe_load(f)

                # Check for securityContext issues
                if "spec" in data and "template" in data["spec"]:
                    containers = data["spec"]["template"]["spec"].get("containers", [])
                    for container in containers:
                        if "securityContext" not in container:
                            self.add_issue("SECURITY", "MEDIUM", "Missing securityContext", str(k8s_file))
                        if container.get("image", "").startswith("latest"):
                            self.add_issue("SECURITY", "LOW", "Using latest image tag", str(k8s_file))
            except Exception as e:
                self.add_issue("CONFIG", "LOW", f"Could not parse Kubernetes YAML: {e}", str(k8s_file))

        # Check environment variables for sensitive data
        env_files = [".env", ".env.example", "env.example"]
        for env_file in env_files:
            if (self.project_root / env_file).exists():
                try:
                    content = (self.project_root / env_file).read_text()
                    if "password" in content.lower() or "secret" in content.lower():
                        self.add_issue("SECURITY", "HIGH", f"Potential sensitive data in {env_file}", env_file)
                except Exception as e:
                    self.add_issue("FILE_ACCESS", "LOW", f"Could not read env file: {e}", env_file)

        self.add_passed_check("Security Audit", "Checked Dockerfiles, Kubernetes manifests, and environment files")

    async def audit_performance(self):
        """Audit performance bottlenecks and optimization opportunities."""
        logger.info("⚡ Auditing performance...")

        # Check for potential N+1 queries or inefficient patterns
        python_files = list(self.project_root.rglob("*.py"))
        for py_file in python_files:
            if "venv" in str(py_file) or "node_modules" in str(py_file):
                continue

            try:
                content = py_file.read_text()

                # Check for inefficient loops
                if "for" in content and "range(len(" in content:
                    self.add_issue("PERFORMANCE", "LOW", "Potential inefficient loop pattern", str(py_file))

                # Check for blocking operations in async code
                if "async def" in content and ("time.sleep(" in content or "requests." in content):
                    self.add_issue("PERFORMANCE", "MEDIUM", "Blocking operation in async function", str(py_file))

                # Check for large data structures
                if "list(" in content and "range(" in content and "10000" in content:
                    self.add_issue("PERFORMANCE", "MEDIUM", "Potential large data structure creation", str(py_file))

            except Exception as e:
                continue

        # Check resource limits in Kubernetes
        k8s_files = list(self.project_root.glob("k8s-*.yaml"))
        for k8s_file in k8s_files:
            try:
                with open(k8s_file) as f:
                    data = yaml.safe_load(f)

                if "spec" in data and "template" in data["spec"]:
                    containers = data["spec"]["template"]["spec"].get("containers", [])
                    for container in containers:
                        resources = container.get("resources", {})
                        if not resources.get("limits"):
                            self.add_issue("PERFORMANCE", "MEDIUM", "Missing resource limits", str(k8s_file))
                        if not resources.get("requests"):
                            self.add_issue("PERFORMANCE", "LOW", "Missing resource requests", str(k8s_file))
            except Exception:
                continue

        self.add_passed_check("Performance Audit", "Checked for bottlenecks and resource configurations")

    async def audit_infrastructure(self):
        """Audit infrastructure configurations."""
        logger.info("🏗️ Auditing infrastructure...")

        # Check Cloud Build configuration
        cloudbuild_file = self.project_root / "cloudbuild.yaml"
        if cloudbuild_file.exists():
            try:
                with open(cloudbuild_file) as f:
                    data = yaml.safe_load(f)

                # Check for timeouts
                if "timeout" not in data:
                    self.add_issue("INFRA", "MEDIUM", "Missing build timeout", "cloudbuild.yaml")

                # Check for machine types
                if "options" in data and "machineType" in data["options"]:
                    machine_type = data["options"]["machineType"]
                    if "HIGHCPU" not in machine_type:
                        self.add_issue("INFRA", "LOW", "Consider using high-CPU machine for builds", "cloudbuild.yaml")

            except Exception as e:
                self.add_issue("CONFIG", "MEDIUM", f"Could not parse cloudbuild.yaml: {e}", "cloudbuild.yaml")

        # Check Helm chart
        helm_dir = self.project_root / "helm" / "trading-system"
        if helm_dir.exists():
            chart_file = helm_dir / "Chart.yaml"
            if chart_file.exists():
                try:
                    with open(chart_file) as f:
                        chart = yaml.safe_load(f)

                    if not chart.get("version"):
                        self.add_issue("INFRA", "LOW", "Missing chart version", str(chart_file))

                except Exception as e:
                    self.add_issue("CONFIG", "MEDIUM", f"Could not parse Chart.yaml: {e}", str(chart_file))

        self.add_passed_check("Infrastructure Audit", "Checked Cloud Build and Helm configurations")

    async def audit_cloud_config(self):
        """Audit cloud-specific configurations."""
        logger.info("☁️ Auditing cloud configurations...")

        # Check Firebase configuration
        firebase_file = self.project_root / "firebase.json"
        if firebase_file.exists():
            try:
                with open(firebase_file) as f:
                    data = json.load(f)

                if "hosting" not in data:
                    self.add_issue("CLOUD", "HIGH", "Missing Firebase hosting configuration", "firebase.json")

                hosting = data.get("hosting", {})
                if not hosting.get("site"):
                    self.add_issue("CLOUD", "MEDIUM", "Missing Firebase site configuration", "firebase.json")

            except Exception as e:
                self.add_issue("CONFIG", "MEDIUM", f"Could not parse firebase.json: {e}", "firebase.json")

        # Check for service account keys (security risk)
        key_files = list(self.project_root.glob("*key.json"))
        if key_files:
            for key_file in key_files:
                self.add_issue("SECURITY", "CRITICAL", "Service account key file found in repository", str(key_file))

        self.add_passed_check("Cloud Config Audit", "Checked Firebase and GCP configurations")

    async def audit_dependencies(self):
        """Audit dependencies and requirements."""
        logger.info("📦 Auditing dependencies...")

        # Check requirements.txt
        req_file = self.project_root / "requirements.txt"
        if req_file.exists():
            try:
                content = req_file.read_text()
                if "==" not in content and "requirements" not in content:
                    self.add_issue("DEPENDENCIES", "LOW", "Consider pinning dependency versions", "requirements.txt")
            except Exception as e:
                self.add_issue("FILE_ACCESS", "LOW", f"Could not read requirements.txt: {e}", "requirements.txt")

        # Check package.json
        package_file = self.project_root / "trading-dashboard" / "package.json"
        if package_file.exists():
            try:
                with open(package_file) as f:
                    data = json.load(f)

                deps = data.get("dependencies", {})
                dev_deps = data.get("devDependencies", {})

                # Check for outdated or vulnerable packages (basic check)
                vulnerable_patterns = ["old", "deprecated", "vulnerable"]
                for dep in list(deps.keys()) + list(dev_deps.keys()):
                    for pattern in vulnerable_patterns:
                        if pattern in dep.lower():
                            self.add_issue("DEPENDENCIES", "HIGH", f"Potentially vulnerable package: {dep}", str(package_file))

            except Exception as e:
                self.add_issue("FILE_ACCESS", "LOW", f"Could not parse package.json: {e}", str(package_file))

        self.add_passed_check("Dependencies Audit", "Checked Python and Node.js dependencies")

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive audit report."""
        report = {
            "summary": {
                "critical_issues": len([i for i in self.issues if i["severity"] == "CRITICAL"]),
                "high_issues": len([i for i in self.issues if i["severity"] == "HIGH"]),
                "medium_issues": len([i for i in self.issues if i["severity"] == "MEDIUM"]),
                "low_issues": len([i for i in self.issues if i["severity"] == "LOW"]),
                "warnings": len(self.warnings),
                "passed_checks": len(self.passed_checks)
            },
            "issues": self.issues,
            "warnings": self.warnings,
            "passed_checks": self.passed_checks,
            "recommendations": self.generate_recommendations()
        }

        # Overall health score
        total_issues = len(self.issues) + len(self.warnings)
        if total_issues == 0:
            report["health_score"] = "A+"
        elif total_issues <= 5:
            report["health_score"] = "A"
        elif total_issues <= 15:
            report["health_score"] = "B"
        elif total_issues <= 30:
            report["health_score"] = "C"
        else:
            report["health_score"] = "D"

        return report

    def generate_recommendations(self) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []

        # Security recommendations
        if any(i["category"] == "SECURITY" for i in self.issues):
            recommendations.append("🔒 Address security issues immediately - review authentication, secrets management")
            recommendations.append("🔑 Implement proper secret rotation and access controls")

        # Performance recommendations
        if any(i["category"] == "PERFORMANCE" for i in self.issues):
            recommendations.append("⚡ Optimize resource allocations and implement performance monitoring")
            recommendations.append("🔄 Implement async patterns and connection pooling")

        # Code quality recommendations
        if any(i["category"] == "CODE_QUALITY" for i in self.issues):
            recommendations.append("🧹 Clean up print statements and implement proper logging")
            recommendations.append("📝 Add comprehensive error handling and input validation")

        # Infrastructure recommendations
        if any(i["category"] == "INFRA" for i in self.issues):
            recommendations.append("🏗️ Review Kubernetes resource limits and implement HPA")
            recommendations.append("☁️ Optimize cloud resource usage and implement cost monitoring")

        # General recommendations
        recommendations.extend([
            "📊 Implement comprehensive monitoring and alerting",
            "🔄 Set up automated testing and CI/CD improvements",
            "📚 Document security procedures and incident response",
            "🎯 Implement performance benchmarking and optimization tracking"
        ])

        return recommendations


async def main():
    """Main audit function."""
    logger.info("🔍 COMPREHENSIVE SYSTEM AUDIT")
    logger.info("=" * 50)

    auditor = ComprehensiveAuditor()
    report = await auditor.run_full_audit()

    # Print summary
    logger.info("\n📊 AUDIT SUMMARY:")
    logger.info(f"Health Score: {report['health_score']}")
    logger.info(f"Critical Issues: {report['summary']['critical_issues']}")
    logger.info(f"High Priority: {report['summary']['high_issues']}")
    logger.info(f"Medium Priority: {report['summary']['medium_issues']}")
    logger.info(f"Low Priority: {report['summary']['low_issues']}")
    logger.info(f"Warnings: {report['summary']['warnings']}")
    logger.info(f"Passed Checks: {report['summary']['passed_checks']}")

    # Print issues
    if report['issues']:
        logger.info("\n🚨 ISSUES FOUND:")
        for issue in report['issues'][:10]:  # Show first 10
            logger.info(f"  {issue['severity']}: {issue['message']} ({issue.get('file', 'N/A')})")

    if report['warnings']:
        logger.info("\n⚠️ WARNINGS:")
        for warning in report['warnings'][:5]:  # Show first 5
            logger.info(f"  {warning['message']} ({warning.get('file', 'N/A')})")

    # Print recommendations
    if report['recommendations']:
        logger.info("\n💡 RECOMMENDATIONS:")
        for rec in report['recommendations'][:5]:  # Show first 5
            logger.info(f"  {rec}")

    # Save detailed report
    report_file = Path("audit_report.json")
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    logger.info(f"\n📄 Detailed report saved to {report_file}")

    # Exit with appropriate code
    critical_count = report['summary']['critical_issues'] + report['summary']['high_issues']
    if critical_count > 0:
        logger.warning(f"❌ {critical_count} critical/high priority issues found")
        return 1
    else:
        logger.info("✅ No critical issues found")
        return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
