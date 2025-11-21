# Super Grok: Critical Helm Template Bug - Production Trading Platform Blocked

## Executive Summary
We're deploying Sapphire AI, a high-frequency cryptocurrency trading platform with 6 specialized AI agents to Google Kubernetes Engine (GKE). The deployment has been blocked for days by a persistent Helm template error that occurs when using the `dig` function for nil-safe value access.

## Current Error (Build f4500c8b-98a1-469d-aaf1-a4115c463d4d)

```
[ERROR] templates/: template: trading-system/templates/deployment-simplified-trader.yaml:61:16:
executing "trading-system/templates/deployment-simplified-trader.yaml" at <include "trading-system.readinessProbe" $>:
error calling include: template: trading-system/templates/_helpers.tpl:89:38:
executing "trading-system.readinessProbe" at <dig "readinessProbe" "initialDelaySeconds" nil $.Values>:
error calling dig: interface conversion: interface {} is chartutil.Values, not map[string]interface {}
```

## Root Cause Analysis

1. **Initial Problem**: Kubernetes validation errors due to incorrect YAML structure:
   ```
   unknown field "spec.template.spec.containers[0].readinessProbe.httpGet.initialDelaySeconds"
   ```
   The readiness probe timing fields were incorrectly nested under `httpGet` instead of being siblings.

2. **First Fix Attempt**: Created a helper template with defensive nil-checking using `with` blocks
   - Result: Still got nil pointer errors inside `range` loops

3. **Second Fix Attempt**: Implemented "double-root anchoring" with `hasKey` + `kindIs`
   - Result: Fixed nil pointer but still had indentation issues

4. **Current Fix Attempt**: Used `dig` function for nil-safe access (recommended by user)
   - Result: New error - `dig` function doesn't accept `chartutil.Values` type

## Technical Details

### Current Helper Template (_helpers.tpl)
```yaml
{{- define "trading-system.readinessProbe" -}}
  initialDelaySeconds: {{ default 60 (dig "readinessProbe" "initialDelaySeconds" nil $.Values) }}
  periodSeconds: {{ default 30 (dig "readinessProbe" "periodSeconds" nil $.Values) }}
  timeoutSeconds: {{ default 20 (dig "readinessProbe" "timeoutSeconds" nil $.Values) }}
  failureThreshold: {{ default 3 (dig "readinessProbe" "failureThreshold" nil $.Values) }}
  successThreshold: {{ default 1 (dig "readinessProbe" "successThreshold" nil $.Values) }}
{{- end -}}
```

### How It's Called (in all deployment templates)
```yaml
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            {{- include "trading-system.readinessProbe" $ | indent 10 }}
```

### Environment
- Helm version: 3.12+
- Kubernetes: GKE
- Chart structure: Main chart with 6 agent sub-deployments
- Context: The error happens during `helm lint` in Cloud Build

## What We've Tried

1. **Simple approach**: Direct value access with defaults
   - Failed: Nil pointer when parent doesn't exist

2. **With blocks**: Using `with .Values.readinessProbe`
   - Failed: Context issues in range loops

3. **Defensive checks**: `hasKey` + `kindIs` + explicit root reference
   - Worked but complex

4. **Dig function**: `dig "readinessProbe" "initialDelaySeconds" nil $.Values`
   - Failed: Type incompatibility with chartutil.Values

## The Challenge

We need a helper template that:
1. Is nil-safe when `.Values.readinessProbe` doesn't exist
2. Works correctly inside `range` loops (where context changes)
3. Produces correct YAML indentation (timing fields as siblings to httpGet)
4. Is compatible with Helm 3.12+ type system
5. Is simple and maintainable

## Question for Super Grok

**How do we fix the `dig` function error where it expects `map[string]interface{}` but receives `chartutil.Values`?**

Specific requirements:
1. Must handle nil/missing `.Values.readinessProbe` gracefully
2. Must work inside range loops where `$` is passed
3. Must be compatible with Helm's type system
4. Should be the simplest possible solution

Can you provide:
1. The exact helper template code that will work
2. Explanation of why `dig` fails with chartutil.Values
3. The best practice pattern for this common Helm scenario
4. Any alternative approaches that are cleaner than our previous attempts

This is blocking a $2M+ trading platform deployment - we need the definitive, production-ready solution that will work first time.

## Additional Context

The readinessProbe values in values.yaml:
```yaml
readinessProbe:
  enabled: true
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 20
  failureThreshold: 3
  successThreshold: 1
```

But the helper must also work when `readinessProbe` is not defined at all in values.
