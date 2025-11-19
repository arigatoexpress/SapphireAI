{{/*
Expand the name of the chart.
*/}}
{{- define "sapphire-trading-system.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "sapphire-trading-system.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "sapphire-trading-system.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "sapphire-trading-system.labels" -}}
helm.sh/chart: {{ include "sapphire-trading-system.chart" . }}
{{ include "sapphire-trading-system.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "sapphire-trading-system.selectorLabels" -}}
app.kubernetes.io/name: {{ include "sapphire-trading-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "sapphire-trading-system.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "sapphire-trading-system.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Image pull policy
*/}}
{{- define "sapphire-trading-system.imagePullPolicy" -}}
{{- .Values.global.imagePullPolicy | default .Values.trading.image.pullPolicy | default "IfNotPresent" }}
{{- end }}

{{/*
Full image reference
*/}}
{{- define "sapphire-trading-system.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" }}
{{- $repository := .Values.trading.image.repository | default "cloud-run-source-deploy/cloud-trader" }}
{{- $tag := .Values.trading.image.tag | default .Chart.AppVersion | default "latest" }}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Environment variables template
*/}}
{{- define "sapphire-trading-system.env" -}}
{{- range . }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
{{- end }}

{{/*
Resources template
*/}}
{{- define "sapphire-trading-system.resources" -}}
{{- if . }}
resources:
  {{- if .requests }}
  requests:
    {{- if .requests.cpu }}
    cpu: {{ .requests.cpu }}
    {{- end }}
    {{- if .requests.memory }}
    memory: {{ .requests.memory }}
    {{- end }}
  {{- end }}
  {{- if .limits }}
  limits:
    {{- if .limits.cpu }}
    cpu: {{ .limits.cpu }}
    {{- end }}
    {{- if .limits.memory }}
    memory: {{ .limits.memory }}
    {{- end }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Security context template
*/}}
{{- define "sapphire-trading-system.securityContext" -}}
{{- if .Values.securityContext.enabled }}
securityContext:
  runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
  runAsUser: {{ .Values.securityContext.runAsUser }}
  runAsGroup: {{ .Values.securityContext.runAsGroup }}
  fsGroup: {{ .Values.securityContext.fsGroup }}
{{- end }}
{{- end }}

{{/*
Pod security context template
*/}}
{{- define "sapphire-trading-system.podSecurityContext" -}}
{{- if .Values.securityContext.enabled }}
securityContext:
  runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
  runAsUser: {{ .Values.securityContext.runAsUser }}
  runAsGroup: {{ .Values.securityContext.runAsGroup }}
  fsGroup: {{ .Values.securityContext.fsGroup }}
{{- end }}
{{- end }}
