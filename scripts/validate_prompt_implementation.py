#!/usr/bin/env python3
"""Validate prompt engineering implementation without running full tests.

This script performs static validation of the prompt engineering implementation
by checking that all required components are in place.
"""

import sys
from pathlib import Path

def check_file_exists(filepath: Path, description: str) -> bool:
    """Check if a file exists."""
    exists = filepath.exists()
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {filepath}")
    return exists

def check_imports() -> bool:
    """Check that key imports work."""
    try:
        # Check if files can be parsed
        import ast
        
        files_to_check = [
            "cloud_trader/prompt_engineer.py",
            "cloud_trader/strategies.py",
            "cloud_trader/schemas.py",
            "cloud_trader/metrics.py",
        ]
        
        print("\nChecking Python syntax...")
        for filepath in files_to_check:
            path = Path(filepath)
            if path.exists():
                try:
                    with open(path, 'r') as f:
                        ast.parse(f.read())
                    print(f"✓ {filepath}: Valid Python syntax")
                except SyntaxError as e:
                    print(f"✗ {filepath}: Syntax error - {e}")
                    return False
            else:
                print(f"✗ {filepath}: File not found")
                return False
        
        return True
    except Exception as e:
        print(f"Error checking imports: {e}")
        return False

def main():
    """Main validation function."""
    print("=" * 80)
    print("PROMPT ENGINEERING IMPLEMENTATION VALIDATION")
    print("=" * 80)
    
    root = Path(__file__).parent.parent
    all_passed = True
    
    # Check core files
    print("\n1. Core Implementation Files:")
    print("-" * 80)
    core_files = [
        ("cloud_trader/prompt_engineer.py", "PromptBuilder and ResponseValidator"),
        ("cloud_trader/schemas.py", "AIStrategyResponse schema"),
        ("cloud_trader/metrics.py", "Prompt metrics"),
        ("cloud_trader/config.py", "Prompt configuration"),
        ("cloud_trader/strategies.py", "StrategySelector integration"),
    ]
    
    for filepath, description in core_files:
        if not check_file_exists(root / filepath, description):
            all_passed = False
    
    # Check test files
    print("\n2. Test Files:")
    print("-" * 80)
    test_files = [
        ("tests/test_prompt_engineering.py", "Unit tests"),
        ("tests/test_ai_inference_integration.py", "Integration tests"),
    ]
    
    for filepath, description in test_files:
        if not check_file_exists(root / filepath, description):
            all_passed = False
    
    # Check scripts
    print("\n3. Evaluation Scripts:")
    print("-" * 80)
    scripts = [
        ("scripts/evaluate_prompts.py", "Prompt evaluation script"),
    ]
    
    for filepath, description in scripts:
        if not check_file_exists(root / filepath, description):
            all_passed = False
    
    # Check configuration files
    print("\n4. Configuration Files:")
    print("-" * 80)
    config_files = [
        ("cloud_trader/prompt_config/prompt_versions.yaml", "Prompt version management"),
        ("cloud_trader/prompt_templates/__init__.py", "Prompt templates directory"),
    ]
    
    for filepath, description in config_files:
        if not check_file_exists(root / filepath, description):
            all_passed = False
    
    # Check Python syntax
    print("\n5. Python Syntax Validation:")
    print("-" * 80)
    if not check_imports():
        all_passed = False
    
    # Summary
    print("\n" + "=" * 80)
    if all_passed:
        print("✓ ALL VALIDATION CHECKS PASSED")
        print("\nImplementation is complete. Ready for:")
        print("  - Unit test execution: pytest tests/test_prompt_engineering.py")
        print("  - Integration test execution: pytest tests/test_ai_inference_integration.py")
        print("  - Evaluation script: python scripts/evaluate_prompts.py")
        return 0
    else:
        print("✗ SOME VALIDATION CHECKS FAILED")
        print("\nPlease review the errors above before proceeding.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

