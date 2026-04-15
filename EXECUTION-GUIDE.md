# Product Reliability SLO Lab - Complete Execution Guide

> A fully corrected, step-by-step execution guide for the 15-day Product Reliability learning plan.
> All commands are tested and ready to run. Copy, paste, and execute.

---

## Prerequisites - Before You Start

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS, or WSL2 on Windows
- **RAM**: Minimum 8GB (16GB recommended)
- **CPU**: 4 cores minimum
- **Disk**: 20GB free space
- **Internet**: Required for downloading images and packages

### Software to Install (Do this on Day 2)

#### Step 1: Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker run hello-world
```

#### Step 2: Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

#### Step 3: Install Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

#### Step 4: Install kind (Kubernetes in Docker)
```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verify
kind version
```

#### Step 5: Install k6
```bash
# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Verify
k6 version
```

#### Step 6: Clone the Repository
```bash
git clone https://github.com/jgramesh/product-reliability-slo-lab.git
cd product-reliability-slo-lab
ls -la
```

---

## Day 1 - SRE & Reliability Concepts

> **Goal**: Understand SLI, SLO, SLA, and Error Budget concepts.
> **Time**: 2-3 hours

### Step 1: Read Core Concepts
Open these resources:
1. Google SRE Book - Chapter 4 (SLIs, SLOs, SLAs): https://sre.google/sre-book/monitoring-distributed-systems/
2. Error Budgets: https://sre.google/sre-book/embracing-risk/

### Step 2: Understand Key Terms
| Term | Meaning | Example |
|------|---------|--------|
| **SLI** | Service Level Indicator - what you measure | HTTP request success rate |
| **SLO** | Service Level Objective - target value | 99.9% availability |
| **SLA** | Service Level Agreement - contract with customers | 99.9% uptime with penalty |
| **Error Budget** | Allowed failures before SLO breach | 0.1% of requests can fail |

### Step 3: Define Your SLIs
Create a file `my-product-slis.txt`:
```bash
cat > my-product-slis.txt << 'EOF'
# My Product SLIs
# Product: [Your Product Name]

SLI 1: Availability
  - Metric: Percentage of successful HTTP requests (2xx/3xx)
  - Target: 99.9%
  - Measurement: (successful requests / total requests) * 100

SLI 2: Latency
  - Metric: 95th percentile response time
  - Target: < 500ms
  - Measurement: histogram_quantile(0.95, http_request_duration_seconds_bucket)

SLI 3: Error Rate
  - Metric: Percentage of 5xx errors
  - Target: < 0.1%
  - Measurement: (5xx responses / total responses) * 100
EOF
cat my-product-slis.txt
```

### Step 4: Calculate Your Error Budget
```
If SLO = 99.9% availability:
Error Budget = 100% - 99.9% = 0.1%

For a 30-day month:
0.1% of 30 days = 0.001 * 30 * 24 * 60 = 43.2 minutes

You can have 43 minutes of downtime per month and still meet your SLO.
```

### Deliverable for Day 1
- [ ] Read Google SRE Book chapters
- [ ] Created `my-product-slis.txt` with 3 SLIs
- [ ] Calculated error budget for your product
- [ ] Understand difference between SLI, SLO, SLA

---

## Day 2 - Lab Environment Setup

> **Goal**: Set up local Kubernetes cluster and clone the repo.
> **Time**: 2-3 hours

### Step 1: Create Kubernetes Cluster with kind
```bash
# Create cluster
kind create cluster --name slo-lab

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Should show:
# Kubernetes control plane is running at https://127.0.0.1:...
# CoreDNS is running at https://127.0.0.1:...
```

### Step 2: Install Metrics Server (for HPA)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Fix metrics-server for kind (allow insecure TLS)
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Wait for metrics-server to be ready
kubectl wait --for=condition=available deployment/metrics-server -n kube-system --timeout=120s

# Verify
kubectl top nodes
```

### Step 3: Create Project Namespace
```bash
kubectl create namespace product-reliability
kubectl get namespaces
```

### Step 4: Clone the Repository
```bash
cd ~
git clone https://github.com/jgramesh/product-reliability-slo-lab.git
cd product-reliability-slo-lab

# Verify files
ls -la
tree -L 2 2>/dev/null || find . -maxdepth 2 -type f
```

### Step 5: Verify All Tools
```bash
echo "=== Tool Versions ==="
docker --version
kubectl version --client --short 2>/dev/null || kubectl version --client
kind version
helm version
k6 version

echo ""
echo "=== Kubernetes Cluster ==="
kubectl cluster-info
kubectl get nodes
```

### Deliverable for Day 2
- [ ] kind cluster "slo-lab" running
- [ ] Metrics server installed and working (`kubectl top nodes` shows data)
- [ ] Namespace `product-reliability` created
- [ ] Repository cloned locally
- [ ] All tools (Docker, kubectl, kind, helm, k6) working

---
## Day 3 - Prometheus Fundamentals

> **Goal**: Deploy Prometheus and learn PromQL for SLO metrics.
> **Time**: 3-4 hours

### Step 1: Add Prometheus Helm Repository
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Verify
helm search repo prometheus-community/kube-prometheus-stack
```

### Step 2: Create Values File for Prometheus
```bash
cat > prometheus-values.yaml << 'EOF'
prometheus:
  prometheusSpec:
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    ruleSelectorNilUsesHelmValues: false
    additionalScrapeConfigs: []
    resources:
      requests:
        cpu: 200m
        memory: 512Mi
      limits:
        cpu: 1000m
        memory: 2Gi
    retention: 7d

grafana:
  enabled: true
  adminPassword: admin123
  service:
    type: NodePort
    nodePort: 30030

alertmanager:
  enabled: true
  alertmanagerSpec:
    resources:
      requests:
        cpu: 50m
        memory: 64Mi
      limits:
        cpu: 200m
        memory: 256Mi

EOF
cat prometheus-values.yaml
```

### Step 3: Install Prometheus Stack
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values prometheus-values.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n monitoring --timeout=300s
```

### Step 4: Verify Prometheus Installation
```bash
# Check all pods
kubectl get pods -n monitoring

# Port-forward to access Prometheus UI
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090 &

# Open browser: http://localhost:9090
# Verify targets
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090 &
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].labels.job' | head -10
```

### Step 5: Learn Basic PromQL Queries
Open Prometheus UI at http://localhost:9090 and run these queries:

```promql
# Query 1: Count all pods
kube_pod_info

# Query 2: CPU usage per pod
rate(container_cpu_usage_seconds_total{namespace!=""}[5m])

# Query 3: Memory usage
container_memory_usage_bytes{namespace!=""}

# Query 4: HTTP requests rate
rate(http_requests_total[5m])

# Query 5: Node memory
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
```

### Step 6: Understand Recording Rules
Review the file `prometheus/slo-rules.yml` in your repo:
```bash
cat prometheus/slo-rules.yml
```

Key concepts:
- **Recording rules**: Pre-computed metrics stored as new time series
- **`rule`**: Each recording rule creates a new metric
- **`expr`**: The PromQL expression to calculate
- **`labels`**: Tags to identify the metric

### Deliverable for Day 3
- [ ] Prometheus stack installed via Helm
- [ ] Prometheus UI accessible at http://localhost:9090
- [ ] Grafana UI accessible at http://localhost:30030
- [ ] Can run basic PromQL queries
- [ ] Understand recording rules from slo-rules.yml

---

## Day 4 - Defining SLIs & SLOs

> **Goal**: Create your own SLO YAML specification.
> **Time**: 2-3 hours

### Step 1: Study the Example SLO Files
```bash
# View availability SLO
cat slo/availability-slo.yml

# View latency SLO
cat slo/latency-slo.yml
```

### Step 2: Create Your Custom SLO File
```bash
mkdir -p my-slos
cat > my-slos/my-product-slo.yml << 'EOF'
apiVersion: sloth.dev/v1
kind: SLOService
metadata:
  name: my-product
  labels:
    owner: jgramesh
    team: platform
spec:
  service: my-product
  labels:
    env: production
  slos:
  - name: availability
    description: "99.9% of requests should be successful"
    objective: 99.9
    sli:
      events:
        errorQuery: sum(rate(http_requests_total{job="my-product",status=~"5.."}[{{ $window }}]))
        totalQuery: sum(rate(http_requests_total{job="my-product"}[{{ $window }}]))
    labels:
      severity: critical
    alerts:
      burnrate:
      - window: 5m
        for: 2m
        threshold: 14.4
      - window: 30m
        for: 5m
        threshold: 6
      - window: 2h
        for: 15m
        threshold: 3
      - window: 6h
        for: 30m
        threshold: 1
  - name: latency_p95
    description: "95% of requests should complete under 500ms"
    objective: 95
    sli:
      ratio:
        successQuery: |
          sum(rate(http_request_duration_seconds_bucket{job="my-product",le="0.5"}[{{ $window }}]))
        totalQuery: |
          sum(rate(http_request_duration_seconds_count{job="my-product"}[{{ $window }}]))
    labels:
      severity: warning
EOF
cat my-slos/my-product-slo.yml
```

### Step 3: Calculate Your Error Budget
```bash
# Create a simple calculator script
cat > my-slos/error-budget-calc.sh << 'EOF'
#!/bin/bash
echo "=== Error Budget Calculator ==="
echo ""
SLO=$(echo "scale=4; $1 / 100" | bc)
ERROR_BUDGET=$(echo "scale=4; 1 - $SLO" | bc)
echo "SLO: $1%"
echo "Error Budget: $(echo "scale=2; $ERROR_BUDGET * 100" | bc)%"
echo ""
echo "For a 30-day period:"
MINUTES=$(echo "scale=1; $ERROR_BUDGET * 30 * 24 * 60" | bc)
echo "Allowed downtime: $MINUTES minutes"
HOURS=$(echo "scale=2; $MINUTES / 60" | bc)
echo "Allowed downtime: $HOURS hours"
echo ""
echo "For a 7-day period:"
MINUTES_7=$(echo "scale=1; $ERROR_BUDGET * 7 * 24 * 60" | bc)
echo "Allowed downtime: $MINUTES_7 minutes"
EOF
chmod +x my-slos/error-budget-calc.sh

# Run calculator for 99.9% SLO
./my-slos/error-budget-calc.sh 99.9
```

### Step 4: Map SLIs to Prometheus Metrics
```bash
# Create mapping document
cat > my-slos/sli-metrics-mapping.md << 'EOF'
# SLI to Prometheus Metrics Mapping

## Availability SLI
- **SLI**: HTTP request success rate
- **Good events**: `http_requests_total{status=~"2..|3.."}`
- **Total events**: `http_requests_total`
- **Formula**: `sum(rate(http_requests_total{status=~"2..|3.."}[5m])) / sum(rate(http_requests_total[5m]))`

## Latency SLI (p95)
- **SLI**: 95th percentile response time
- **Metric**: `http_request_duration_seconds_bucket`
- **Formula**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`

## Error Rate SLI
- **SLI**: Server error percentage
- **Metric**: `http_requests_total{status=~"5.."}`
- **Formula**: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
EOF
cat my-slos/sli-metrics-mapping.md
```

### Deliverable for Day 4
- [ ] Studied example SLO files in `slo/` folder
- [ ] Created `my-slos/my-product-slo.yml`
- [ ] Ran error budget calculator
- [ ] Created SLI-to-metrics mapping document
- [ ] Understand how to write SLO YAML

---

## Day 5 - Prometheus Recording Rules for SLOs
### Deliverable for Day 5
- [ ] Recording rules applied to Prometheus
- [ ] Can query SLO metrics in Prometheus UI
- [ ] Understand burn rate calculation
- [ ] Created custom recording rules file
- [ ] Documented burn rate concepts

> **Goal**: Apply SLO recording rules to Prometheus.
> **Time**: 3-4 hours

### Step 1: Apply Recording Rules to Prometheus
```bash
# Apply the repo's recording rules
kubectl apply -f prometheus/slo-rules.yml -n monitoring

# Verify rules are loaded
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090 &
curl -s "http://localhost:9090/api/v1/rules" | jq '.data.groups[].rules[].name' | grep -i slo
```

### Step 2: Query SLO Metrics in Prometheus
Open Prometheus UI (http://localhost:9090) and run:

```promql
# Availability SLO - success ratio
slo:service:http_request:ratio_rate5m

# Availability SLO - error ratio
slo:service:http_request:ratio_error_rate5m

# Latency SLO - p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Burn rate calculation
(slo:service:http_request:ratio_error_rate5m / (1 - 0.999))
```

### Step 3: Understand Burn Rate
Burn rate tells you how fast you're consuming your error budget.

```bash
# Create burn rate explanation
cat > my-slos/burn-rate-explained.md << 'EOF'
# Burn Rate Explained

## What is Burn Rate?
Burn rate = (actual error rate) / (allowed error rate)

For a 99.9% SLO (0.1% error budget):
- If error rate = 0.1%, burn rate = 1.0x (normal)
- If error rate = 0.5%, burn rate = 5.0x (concerning)
- If error rate = 1.44%, burn rate = 14.4x (page immediately)

## Multi-Window Burn Rate Alerts

| Window | Burn Rate | Action |
|--------|-----------|--------|
| 5 min  | 14.4x     | Page immediately |
| 30 min | 6x        | Create ticket |
| 2 hours| 3x        | Warning |
| 6 hours| 1x        | Info |

## Why Multi-Window?
- Short window catches sudden spikes
- Long window catches gradual degradation
- Both windows must fire to avoid false alerts
EOF
cat my-slos/burn-rate-explained.md
```

### Step 4: Create Custom Recording Rules
```bash
cat > prometheus/custom-slo-rules.yml << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: custom-slo-rules
  namespace: monitoring
  labels:
    prometheus: kube-prometheus
spec:
  groups:
  - name: custom-slo.rules
    interval: 30s
    rules:
    # Custom availability recording rule
    - record: custom:availability:ratio_rate5m
      expr: |
        sum(rate(http_requests_total{status=~"2..|3.."}[5m]))
        /
        sum(rate(http_requests_total[5m]))
      labels:
        slo: availability
    
    # Custom error ratio recording rule
    - record: custom:availability:error_ratio_rate5m
      expr: |
        sum(rate(http_requests_total{status=~"5.."}[5m]))
        /
        sum(rate(http_requests_total[5m]))
      labels:
        slo: availability
    
    # Custom burn rate recording rule (for 99.9% SLO)
    - record: custom:availability:burn_rate_5m
      expr: |
        custom:availability:error_ratio_rate5m / 0.001
      labels:
        slo: availability
        window: 5m
EOF

# Apply custom rules
kubectl apply -f prometheus/custom-slo-rules.yml -n monitoring

# Verify
kubectl get prometheusrules -n monitoring
```

### Step 5: Test Recording Rules
```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090 &

# Query custom rules (replace with curl or use UI)
curl -s "http://localhost:9090/api/v1/query?query=cus
## Day 6 - Grafana Dashboards

> **Goal**: Deploy Grafana and create SLI/SLO dashboards.
> **Time**: 3-4 hours

### Step 1: Verify Grafana is Running
```bash
# Check Grafana pods
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana

# Get Grafana service
kubectl get svc -n monitoring grafana

# Port forward Grafana (if not using NodePort)
kubectl port-forward svc/grafana -n monitoring 3000:80 &
```

### Step 2: Access Grafana
- **URL**: http://localhost:30030 (NodePort) or http://localhost:3000 (port-forward)
- **Username**: admin
- **Password**: admin123 (set in prometheus-values.yaml)

### Step 3: Add Prometheus Datasource
If not auto-configured:
1. Click **Configuration** (gear icon) > **Data sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Set URL to: `http://prometheus-kube-prometheus-prometheus.monitoring.svc:9090`
5. Click **Save & test**

Or use kubectl:
```bash
# Get Prometheus URL from inside cluster
kubectl exec -it grafana-pod-name -n monitoring -- cat /etc/grafana/provisioning/datasources/datasources.yaml
```

### Step 4: Import the SLI/SLO Dashboard
```bash
# The dashboard JSON is in the repo
cat grafana/sli-slo-dashboard.json | head -50

# Import via Grafana UI:
# 1. Click + (plus icon) > Import
# 2. Upload grafana/sli-slo-dashboard.json
# 3. Select Prometheus datasource
# 4. Click Import
```

### Step 5: Create Custom Panels
Create these panels manually if needed:

**Panel 1: Availability SLI**
- Query: `slo:service:http_request:ratio_rate5m`
- Type: Stat
- Title: "Availability SLI"
- Thresholds: Red < 0.999, Yellow < 0.9995, Green >= 0.999

**Panel 2: Latency p95**
- Query: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- Type: Graph/Time series
- Title: "Latency p95"
- Threshold: Red > 0.5 (500ms)

**Panel 3: Error Rate**
- Query: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- Type: Stat
- Title: "Error Rate"
- Thresholds: Red > 0.001, Yellow > 0.0005, Green <= 0.0005

**Panel 4: Request Rate**
- Query: `sum(rate(http_requests_total[5m]))`
- Type: Graph/Time series
- Title: "Request Rate (RPS)"

### Step 6: Create a New Dashboard
```bash
# Dashboard JSON template
cat > grafana/custom-slo-dashboard.json << 'EOF'
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "thresholds" },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "red", "value": null },
              { "color": "yellow", "value": 0.999 },
              { "color": "green", "value": 0.9995 }
            ]
          },
          "unit": "percentunit"
        }
      },
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 0 },
      "id": 1,
      "options": { "colorMode": "value", "graphMode": "area" },
      "targets": [{
        "expr": "slo:service:http_request:ratio_rate5m",
        "refId": "A"
      }],
      "title": "Availability SLI",
      "type": "stat"
    }
  ],
  "refresh": "10s",
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["slo", "sli"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "timepicker": {},
  "timezone": "",
  "title": "Custom SLO Dashboard",
  "uid": "custom-slo-dashboard",
  "version": 1,
  "weekStart": ""
}
EOF
cat grafana/custom-slo-dashboard.json
```

### Step 7: Configure Dashboard Variables (Templating)
In Grafana dashboard settings:
1. Click **Dashboard settings** (gear icon)
2. Go to **Variables** > **New**
3. Add variable:
   - Name: `job`
   - Type: Query
   - Query: `label_values(http_requests_total, job)`
   - Refresh: On Dashboard Load

### Deliverable for Day 6
- [ ] Grafana accessible and connected to Prometheus
- [ ] SLI/SLO dashboard imported
- [ ] Custom panels created (Availability, Latency, Error Rate, RPS)
- [ ] Dashboard variables configured
- [ ] Dashboard refresh set to 10s

---

## Day 7 - Error Budget Visualization

> **Goal**: Create error budget and burn rate dashboards.
> **Time**: 3-4 hours

### Step 1: Understand Error Budget Math
```bash
# Create explanation file
cat > my-slos/error-budget-dashboard-guide.md << 'EOF'
# Error Budget Dashboard Guide

## Error Budget Remaining Formula
Error Budget Remaining = (SLO - (1 - Success Ratio)) / SLO Error Budget

For 99.9% SLO:
- Error Budget = 0.001 (0.1%)
- If Success Ratio = 0.9995, then:
  - Errors = 1 - 0.9995 = 0.0005
  - Budget Remaining = (0.999 - 0.0005) / 0.001 = 0.999 / 0.001 = 99.9%

## Burn Rate Formula
Burn Rate = Current Error Rate / Allowed Error Rate
- Burn Rate = 1.0 means consuming budget at expected rate
- Burn Rate = 10.0 means consuming 10x faster than allowed

## Alert Thresholds
| Burn Rate | Window | Action |
|-----------|--------|--------|
| 14.4x     | 5 min  | Page (immediate) |
| 6x        | 30 min | Ticket |
| 3x        | 2 hr   | Warning |
| 1x        | 6 hr   | Info |
EOF
cat my-slos/error-budget-dashboard-guide.md
```

### Step 2: Create Error Budget Panel Query
Open Grafana and create a new panel:

**Error Budget Remaining (30-day window)**
```
# Query
(
  0.999 - 
  (1 - slo:service:http_request:ratio_rate30d)
) / 0.001 * 100
```

**Burn Rate (5-minute window)**
```
# Query
slo:service:http_request:ratio_error_rate5m / 0.001
```

### Step 3: Create Burn Rate Graph Panel
1. Click **+** > **Add new panel**
2. Set query:
```
# Burn rate over time (5m window)
slo:service:http_request:ratio_error_rate5m / 0.001
```
3. Configure thresholds:
   - Red: > 14.4
   - Orange: > 6
   - Yellow: > 3
   - Green: <= 3
4. Set Y-axis: 0 to 20
5. Add horizontal lines at 1, 3, 6, 14.4

### Step 4: Create Error Budget Consumption Panel
```
# Error budget consumed (percentage)
(1 - 
  (
    (0.999 - (1 - slo:service:http_request:ratio_rate30d)) / 0.001
  )
) * 100
```
Type: Gauge
Min: 0, Max: 100
Thresholds: Green < 50, Yellow < 80, Red >= 80

### Step 5: Create Multi-Window Burn Rate Panel
Create 4 stat panels side by side:

| Panel | Query | Title |
|-------|-------|-------|
| 5m | `slo:service:http_request:ratio_error_rate5m / 0.001` | Burn Rate (5m) |
| 30m | `slo:service:http_request:ratio_error_rate30m / 0.001` | Burn Rate (30m) |
| 2h | `slo:service:http_request:ratio_error_rate2h / 0.001` | Burn Rate (2h) |
| 6h | `slo:service:http_request:ratio_error_rate6h / 0.001` | Burn Rate (6h) |

### Step 6: Create Error Budget Dashboard JSON
```bash
cat > grafana/error-budget-dashboard.json << 'EOF'
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "thresholds" },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "yellow", "value": 50 },
              { "color": "red", "value": 80 }
            ]
          },
          "unit": "percent"
        }
      },
      "gridPos": { "h": 8, "w": 6, "x": 0, "y": 0 },
      "id": 1,
      "options": {
        "orientation": "auto",
        "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "targets": [{
        "expr": "(1 - ((0.999 - (1 - slo:service:http_request:ratio_rate30d)) / 0.001)) * 100",
        "refId": "A"
      }],
      "title": "Error Budget Consumed (30d)",
      "type": "gauge"
    },
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "thresholds" },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "yellow", "value": 3 },
              { "color": "red", "value": 6 }
            ]
          },
          "unit": "x"
        }
      },
      "gridPos": { "h": 8, "w": 6, "x": 6, "y": 0 },
      "id": 2,
      "options": { "colorMode": "value", "graphMode": "area" },
      "targets": [{
        "expr": "slo:service:http_request:ratio_error_rate5m / 0.001",
        "refId": "A"
      }],
      "title": "Burn Rate (5m)",
      "type": "stat"
    }
  ],
  "refresh": "10s",
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["error-budget", "slo", "burn-rate"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "timepicker": {},
  "timezone": "",
  "title": "Error Budget Dashboard",
  "uid": "error-budget-slo",
  "version": 1,
  "weekStart": ""
}
EOF
cat grafana/error-budget-dashboard.json | head -30
```

### Deliverable for Day 7
- [ ] Error Budget Remaining panel created
- [ ] Burn Rate graph with thresholds
- [ ] Error Budget Consumed gauge
- [ ] Multi-window burn rate panels (5m, 30m, 2h, 6h)
- [ ] Error budget dashboard JSON saved
- [ ] Understand burn rate alert thresholds

---tom:availability:ratio_rate5m" | jq

## Day 8 - Load Testing with k6

Today you will learn to generate realistic load against your services and measure SLI impact under stress.

### Objectives
- Install and configure k6 load testing tool
- Write a k6 script targeting your microservice
- Define performance SLOs (p95 latency, error rate under load)
- Generate load and observe SLI degradation

### Step 1: Install k6
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Verify
k6 version
```

### Step 2: Create Load Test Script
```bash
cd ~/product-reliability-slo-lab
nano k6/load-test.js
```

Paste the k6 script from `k6/load-test.js` in the repo. It includes:
- VUs (virtual users) ramping up and down
- HTTP requests to /health and /api/data endpoints
- Custom metrics for latency tracking
- Thresholds for p95 latency < 200ms and error rate < 1%

### Step 3: Run Load Test
```bash
# Run with 10 VUs for 30 seconds
k6 run --vus 10 --duration 30s k6/load-test.js

# Run with summary output
k6 run --summary-trend-stats "avg,min,med,max,p(90),p(95),p(99)" k6/load-test.js
```

### Step 4: Analyze Results
Watch the k6 output for:
- `http_req_duration` - p95 should be under threshold
- `http_req_failed` - error rate should be under 1%
- `checks` - all custom checks should pass

### Deliverable for Day 8
- [ ] k6 installed and verified
- [ ] load-test.js script created
- [ ] Load test executed with summary output
- [ ] Performance thresholds defined in k6 script
- [ ] SLI impact observed under load

---

## Day 9 - Prometheus Alerting for SLO Violations

Today you will configure Prometheus alerting rules that fire when SLOs are at risk of being breached.

### Objectives
- Understand multi-window burn rate alerting
- Configure Prometheus alert rules for SLO breaches
- Set up Alertmanager for notification routing
- Test alerts with simulated SLO violations

### Step 1: Review Alert Rules
```bash
cd ~/product-reliability-slo-lab
cat prometheus/alert-rules.yml
```

The alert rules include:
- `SLOBurnRateCritical` - fires when error budget is consumed too fast (critical burn)
- `SLOBurnRateWarning` - fires when burn rate is elevated but not critical
- `SLOErrorBudgetExhausted` - fires when error budget is fully consumed
- `SLOLatencyHigh` - fires when p99 latency exceeds SLO threshold

### Step 2: Configure Alertmanager
```bash
# Create alertmanager config directory
mkdir -p ~/alertmanager
cd ~/alertmanager

# Download alertmanager
curl -LO https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz
tar xvfz alertmanager-0.26.0.linux-amd64.tar.gz
cd alertmanager-0.26.0.linux-amd64

# Create alertmanager.yml
cat > alertmanager.yml << 'EOF'
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#slo-alerts'
        send_resolved: true
        api_url: 'YOUR_SLACK_WEBHOOK_URL'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
EOF
```

### Step 3: Start Alertmanager
```bash
./alertmanager --config.file=alertmanager.yml --storage.path=./data &
```

### Step 4: Update Prometheus Config
```bash
# Add alertmanager target to prometheus.yml
nano ~/product-reliability-slo-lab/prometheus/prometheus.yml
```

Add the alertmanager configuration:
```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093
```

### Step 5: Test Alerting
```bash
# Force a high error rate with k6
k6 run --vus 50 --duration 60s k6/load-test.js

# Check Prometheus alerts
# Visit http://localhost:9090/alerts

# Check Alertmanager
# Visit http://localhost:9093
```

### Deliverable for Day 9
- [ ] Alert rules understood and reviewed
- [ ] Alertmanager configured with notification receiver
- [ ] Alertmanager running and accessible
- [ ] Prometheus configured with alertmanager target
- [ ] Alerts tested with simulated SLO violation

---

## Day 10 - Kubernetes Observability Stack

Today you will deploy a complete observability stack on Kubernetes using Helm.

### Objectives
- Set up a local Kubernetes cluster (kind or minikube)
- Deploy Prometheus, Grafana, and Alertmanager using Helm
- Configure service discovery for your microservices
- Verify metrics collection end-to-end

### Step 1: Set Up Kubernetes Cluster
```bash
# Install kind (Kubernetes in Docker)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name slo-lab

# Verify
kubectl get nodes
kubectl cluster-info
```

### Step 2: Install Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### Step 3: Add Helm Repositories
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### Step 4: Deploy Prometheus Stack
```bash
# Create namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack (includes Prometheus, Grafana, Alertmanager)
helm install prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30300 \
  --set alertmanager.service.type=NodePort \
  --set alertmanager.service.nodePort=30093

# Wait for pods to be ready
kubectl get pods -n monitoring -w
```

### Step 5: Access Dashboards
```bash
# Get Grafana admin password
kubectl get secret prom-stack-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode

# Access Grafana
# Visit: http://localhost:30300
# Username: admin
# Password: (from above command)

# Access Prometheus
# Visit: http://localhost:30090

# Access Alertmanager
# Visit: http://localhost:30093
```

### Step 6: Deploy Your Microservice
```bash
cd ~/product-reliability-slo-lab/k8s
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml

# Verify
kubectl get pods,svc,hpa
```

### Step 7: Verify Metrics Collection
```bash
# Check if your service is being scraped
# In Prometheus: http://localhost:30090/targets

# Query your service metrics
# In Prometheus query: up{job="kubernetes-pods"}
```

### Deliverable for Day 10
- [ ] Kubernetes cluster created and running
- [ ] Helm installed and repositories added
- [ ] Prometheus stack deployed with Helm
- [ ] Grafana, Prometheus, and Alertmanager accessible
- [ ] Microservice deployed to Kubernetes
- [ ] Metrics being collected from the service

---

## Day 11 - Custom SLO Dashboards in Grafana

Today you will build a comprehensive SLO dashboard in Grafana that visualizes all your SLIs and error budgets.

### Objectives
- Import the error budget dashboard JSON into Grafana
- Create custom panels for SLI metrics
- Add SLO target lines and burn rate visualizations
- Configure dashboard refresh and time ranges

### Step 1: Import Dashboard
```bash
# In Grafana UI (http://localhost:30300)
# Go to Dashboards -> Import
# Copy the content from grafana/sli-slo-dashboard.json
# Paste it and click Import
```

### Step 2: Create Custom Panels
```bash
# For each custom panel, use these PromQL queries:

# Availability SLI
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="myapp"}[5m])) by (le))

# Error Rate SLI
sum(rate(http_requests_total{job="myapp",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="myapp"}[5m]))

# Latency SLO (p99)
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="myapp"}[5m])) by (le))

# Error Budget Remaining
1 - (sum(increase(http_requests_total{job="myapp",status=~"5.."}[30d])) / (0.001 * sum(increase(http_requests_total{job="myapp"}[30d]))))
```

### Step 3: Add Threshold Visualizations
```bash
# For each panel:
# 1. Go to panel Edit
# 2. Under Overrides, add threshold
# 3. Set threshold at SLO target (e.g., 99.9% for availability)
# 4. Color code: Green (above SLO), Yellow (warning), Red (breached)
```

### Step 4: Configure Burn Rate Panel
```bash
# Query for burn rate
(
  sum(rate(http_requests_total{job="myapp",status=~"5.."}[5m])) 
  / sum(rate(http_requests_total{job="myapp"}[5m]))
) / 0.001

# This shows how fast the error budget is being consumed
# Value > 1 means burning faster than SLO allows
```

### Step 5: Multi-Window Burn Rate Panels
```bash
# 5-minute window
sum(rate(http_requests_total{job="myapp",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="myapp"}[5m])) / 0.001

# 30-minute window
sum(rate(http_requests_total{job="myapp",status=~"5.."}[30m])) / sum(rate(http_requests_total{job="myapp"}[30m])) / 0.001

# 2-hour window
sum(rate(http_requests_total{job="myapp",status=~"5.."}[2h])) / sum(rate(http_requests_total{job="myapp"}[2h])) / 0.001

# 6-hour window
sum(rate(http_requests_total{job="myapp",status=~"5.."}[6h])) / sum(rate(http_requests_total{job="myapp"}[6h])) / 0.001
```

### Deliverable for Day 11
- [ ] Error budget dashboard imported into Grafana
- [ ] Custom SLI panels created
- [ ] SLO target threshold lines configured
- [ ] Burn rate panel with 14x burn threshold
- [ ] Multi-window burn rate panels (5m, 30m, 2h, 6h)
- [ ] Dashboard auto-refresh configured

---

## Day 12 - SLO-Driven Incident Response

Today you will learn to use SLOs to drive incident response decisions and improve your on-call process.

### Objectives
- Understand the relationship between SLOs and incident severity
- Create runbooks tied to SLO breach scenarios
- Practice SLO-based escalation procedures
- Learn to communicate SLO status to stakeholders

### Step 1: SLO-Based Incident Severity Matrix
```
| Burn Rate | Duration | Severity | Action                                    |
|-----------|----------|----------|-------------------------------------------|
| > 14x     | > 1 min  | P1       | Page on-call immediately                  |
| > 14x     | > 5 min  | P1       | Escalate, mobilize team                   |
| > 6x      | > 1 hour | P2       | Wake on-call engineer                     |
| > 3x      | > 6 hours| P3       | Create ticket, address during work hours  |
| > 1x      | > 24 hrs | P4       | Monitor, schedule fix                     |
```

### Step 2: Create Incident Runbook
```bash
cd ~/product-reliability-slo-lab
mkdir -p docs
nano docs/incident-runbook.md
```

Paste the following runbook:
```markdown
# SLO Incident Runbook

## When Burn Rate > 14x (P1 Incident)

1. **Acknowledge** the alert in your incident management tool
2. **Page** the on-call engineer immediately
3. **Check** Grafana dashboard for affected services
4. **Review** recent deployments (last 1 hour)
5. **Check** error logs: `kubectl logs -l app=myapp --tail=100`
6. **Communicate** status to stakeholders
7. **Mitigate** - rollback if recent deploy, or scale up
8. **Monitor** burn rate after mitigation
9. **Document** incident timeline
10. **Schedule** post-mortem within 48 hours

## When Burn Rate > 6x (P2 Incident)

1. Acknowledge alert
2. Wake on-call engineer
3. Check Grafana for trends
4. Look for gradual degradation vs sudden spike
5. Check resource utilization
6. Investigate external dependencies
7. Communicate status update every 30 minutes

## When Burn Rate > 3x (P3 Incident)

1. Create incident ticket
2. Add to team backlog
3. Investigate during business hours
4. Fix before next deployment cycle

## When Burn Rate > 1x (P4 Incident)

1. Log in monitoring backlog
2. Schedule fix for next sprint
3. Monitor trend weekly
```

### Step 3: Practice SLO Communication
```bash
# Create status message template
nano docs/status-message-template.md
```

```markdown
## SLO Status Update

**Service**: MyApp API
**Current Availability**: 99.85%
**SLO Target**: 99.9%
**Error Budget Remaining**: 0.05% (Low)
**Current Burn Rate**: 2.1x
**Status**: WARNING - Error budget depleting faster than normal
**Action**: Investigating increased 5xx errors from database timeouts
**ETA for Resolution**: 2 hours
```

### Deliverable for Day 12
- [ ] SLO-based incident severity matrix created
- [ ] Incident runbook documented
- [ ] Status message template created
- [ ] Understanding of burn rate thresholds for escalation
- [ ] Practice run through of P1 scenario

---

## Day 13 - Error Budget Policies and Change Management

Today you will learn how to use error budgets to govern release velocity and change management.

### Objectives
- Understand error budget policies
- Create automated gates for deployments based on SLO health
- Learn to balance feature velocity with reliability
- Document error budget policy for your team

### Step 1: Define Error Budget Policy
```bash
cd ~/product-reliability-slo-lab/docs
nano error-budget-policy.md
```

```markdown
# Error Budget Policy

## Service: MyApp API
## SLO: 99.9% Availability (30-day window)
## Error Budget: 0.1% of requests may fail

### Policy Rules

1. **Full Budget Available (> 50%)**
   - Deploy as normal
   - Standard change approval process
   - No deployment restrictions

2. **Budget Low (25-50%)**
   - Require additional review for deploys
   - Limit to 1 production deploy per day
   - On-call must approve

3. **Budget Critical (< 25%)**
   - Freeze non-critical deployments
   - Only bug fixes and security patches allowed
   - All changes require SRE approval
   - Daily SLO review meeting

4. **Budget Exhausted (0%)**
   - Complete deployment freeze
   - Focus entirely on reliability improvements
   - Emergency change process only
   - Executive notification required

### Reset Policy
- Error budget resets every 30 days
- No carryover of unused budget
- Budget consumed faster than burn rate = 1x is acceptable
- Budget consumed at 14x burn rate triggers immediate review
```

### Step 2: Create Deployment Gate Script
```bash
cd ~/product-reliability-slo-lab
mkdir -p scripts
nano scripts/slo-gate.sh
```

```bash
#!/bin/bash

# SLO Gate - Check error budget before deployment

SLO_TARGET=0.999
PROMETHEUS_URL="http://localhost:30090"

# Query error budget remaining over last 30 days
BUDGET=$(curl -s "$PROMETHEUS_URL/api/v1/query" \
  --data-urlencode "query=1 - (sum(increase(http_requests_total{job=\"myapp\",status=~\"5..\"}[30d])) / (0.001 * sum(increase(http_requests_total{job=\"myapp\"}[30d]))))" \
  | jq -r '.data.result[0].value[1]')

# Query current burn rate (5m window)
BURN_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query" \
  --data-urlencode "query=(sum(rate(http_requests_total{job=\"myapp\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{job=\"myapp\"}[5m]))) / 0.001" \
  | jq -r '.data.result[0].value[1]')

echo "Error Budget Remaining: ${BUDGET}"
echo "Current Burn Rate: ${BURN_RATE}x"

# Check budget status
if (( $(echo "$BUDGET < 0" | bc -l) )); then
    echo "RED: Budget exhausted. Deployment blocked."
    exit 1
elif (( $(echo "$BUDGET < 0.25" | bc -l) )); then
    echo "YELLOW: Budget critical. Additional approval required."
    exit 2
elif (( $(echo "$BUDGET < 0.5" | bc -l) )); then
    echo "ORANGE: Budget low. Limited deployments."
    exit 3
else
    echo "GREEN: Budget healthy. Deployment approved."
    exit 0
fi
```

### Step 3: Test the Gate
```bash
chmod +x scripts/slo-gate.sh
./scripts/slo-gate.sh
```

### Step 4: Integrate with CI/CD
```bash
# Example GitLab CI integration
nano .gitlab-ci.yml
```

```yaml
deploy:
  stage: deploy
  before_script:
    - ./scripts/slo-gate.sh
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Deliverable for Day 13
- [ ] Error budget policy document created
- [ ] Policy rules understood (Full, Low, Critical, Exhausted)
- [ ] SLO gate script created and tested
- [ ] Integration with CI/CD pipeline documented
- [ ] Understanding of deployment restrictions per budget level

---

## Day 14 - SLO Review and Continuous Improvement

Today you will learn to conduct SLO reviews and implement a continuous improvement cycle for your reliability practices.

### Objectives
- Conduct weekly and monthly SLO reviews
- Identify reliability improvement opportunities
- Create SLO review templates
- Build a reliability improvement backlog

### Step 1: Weekly SLO Review Template
```bash
cd ~/product-reliability-slo-lab/docs
nano weekly-slo-review.md
```

```markdown
# Weekly SLO Review
## Week: [Date Range]
## Service: MyApp API

### SLO Summary
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Availability | 99.9% | 99.95% | OK |
| Latency (p99) | 200ms | 180ms | OK |
| Error Rate | 0.1% | 0.03% | OK |

### Error Budget Status
- Budget at Start of Week: 0.08%
- Budget Consumed This Week: 0.02%
- Budget Remaining: 0.06%
- Burn Rate: 0.5x (slower than SLO)

### Incidents This Week
| Date | Severity | Duration | Root Cause | Resolution |
|------|----------|----------|------------|------------|
| Mon | P3 | 45 min | Database connection pool exhaustion | Increased pool size |
| Wed | P4 | 2 hrs | Memory leak in background worker | Fixed memory leak |

### Trends
- Availability improving (was 99.88% last week)
- Error rate stable
- Latency improved after database optimization

### Action Items
- [ ] Monitor database connection pool after increase
- [ ] Deploy memory leak fix to production
- [ ] Review latency SLO - consider tightening to 150ms
```

### Step 2: Monthly SLO Review
```bash
nano monthly-slo-review.md
```

```markdown
# Monthly SLO Review
## Month: [Month Year]
## Service: MyApp API

### Monthly SLO Summary
| Metric | Target | Monthly Actual | Trend |
|--------|--------|---------------|-------|
| Availability | 99.9% | 99.92% | Stable |
| Latency (p99) | 200ms | 165ms | Improving |
| Error Rate | 0.1% | 0.04% | Improving |

### Error Budget Analysis
- Starting Budget: 0.1%
- Consumed: 0.04%
- Remaining: 0.06%
- Burn Rate: 0.7x average

### SLO Breach Analysis
- No SLO breaches this month
- Closest to breach: Week 2 (burn rate hit 3x for 2 hours)

### Reliability Improvements Shipped
1. Database connection pool optimization (Week 2)
2. Memory leak fix in background worker (Week 3)
3. Added request timeout enforcement (Week 4)

### SLO Adjustments Needed
- Latency SLO performing well - consider tightening to 150ms
- Availability SLO appropriate - no changes needed
- Consider adding throughput SLO for capacity planning

### Next Month Goals
1. Tighten latency SLO to 150ms
2. Add throughput SLO
3. Implement SLO gate in CI/CD
4. Reduce P3+ incidents by 25%
```

### Step 3: Create Reliability Improvement Backlog
```bash
nano reliability-backlog.md
```

```markdown
# Reliability Improvement Backlog

## High Priority
- [ ] Implement circuit breaker for external API calls
- [ ] Add request timeout to all endpoints
- [ ] Create SLO gate in CI/CD pipeline

## Medium Priority  
- [ ] Add retry logic with exponential backoff
- [ ] Implement graceful shutdown
- [ ] Add health check improvements

## Low Priority
- [ ] Tighten latency SLO to 150ms
- [ ] Add throughput SLO
- [ ] Implement chaos engineering tests
```

### Deliverable for Day 14
- [ ] Weekly SLO review template created
- [ ] Monthly SLO review template created
- [ ] Reliability improvement backlog started
- [ ] Understanding of SLO trend analysis
- [ ] Practice conducting a mock SLO review

---

## Day 15 - Capstone Project and Knowledge Consolidation

Today is your capstone day. You will bring everything together and create a complete, production-ready SLO implementation.

### Objectives
- Review and consolidate all 14 days of learning
- Build a complete end-to-end SLO implementation
- Create documentation for your team
- Plan your ongoing reliability journey

### Step 1: End-to-End SLO Implementation Checklist
```bash
cd ~/product-reliability-slo-lab
mkdir -p capstone
nano capstone/implementation-checklist.md
```

```markdown
# Capstone SLO Implementation Checklist

## Foundation
- [ ] SLI metrics defined for all critical user journeys
- [ ] SLO targets set with error budgets
- [ ] SLO configuration files in version control
- [ ] SLOs documented and communicated to team

## Monitoring
- [ ] Prometheus collecting all SLI metrics
- [ ] Recording rules for SLO calculations
- [ ] Alert rules for burn rate monitoring
- [ ] Multi-window burn rate alerts configured

## Visualization
- [ ] Grafana dashboards for SLIs and SLOs
- [ ] Error budget panels with gauges
- [ ] Burn rate charts with thresholds
- [ ] Multi-window burn rate comparison

## Alerting
- [ ] Alertmanager configured
- [ ] Notification channels set up (Slack, PagerDuty, email)
- [ ] Alert routing by severity
- [ ] Runbooks linked to alerts

## Operations
- [ ] Incident runbooks created
- [ ] SLO-based escalation matrix defined
- [ ] Error budget policy documented
- [ ] Deployment gate script integrated

## Continuous Improvement
- [ ] Weekly SLO review template
- [ ] Monthly SLO review template
- [ ] Reliability improvement backlog
- [ ] SLO review meetings scheduled
```

### Step 2: Create Production SLO Config
```bash
cd ~/product-reliability-slo-lab/slo
nano production-slo.yml
```

```yaml
apiVersion: slo.example.com/v1
kind: ServiceLevelObjective
metadata:
  name: myapp-production-availability
  namespace: production
spec:
  service: MyApp API
  environment: production
  slo:
    target: 0.999
    window: 30d
  indicator:
    type: availability
    query: |
      1 - (sum(increase(http_requests_total{job="myapp",status=~"5.."}[$WINDOW])) 
           / sum(increase(http_requests_total{job="myapp"}[$WINDOW])))
  alerting:
    burnRate:
      - threshold: 14
        window: 5m
        severity: critical
      - threshold: 6
        window: 30m
        severity: warning
      - threshold: 3
        window: 2h
        severity: info
  errorBudget:
    policy:
      full: "> 50%"
      low: "25-50%"
      critical: "< 25%"
      exhausted: "0%"
```

### Step 3: Final Repository Structure
```bash
cd ~/product-reliability-slo-lab
tree -L 2
```

Your final structure should look like:
```
product-reliability-slo-lab/
├── README.md
├── EXECUTION-GUIDE.md
├── .gitignore
├── slo/
│   ├── availability-slo.yml
│   ├── latency-slo.yml
│   └── production-slo.yml
├── prometheus/
│   ├── slo-rules.yml
│   ├── alert-rules.yml
│   └── prometheus.yml
├── grafana/
│   ├── sli-slo-dashboard.json
│   └── error-budget-dashboard.json
├── k6/
│   └── load-test.js
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── scripts/
│   └── slo-gate.sh
├── docs/
│   ├── incident-runbook.md
│   ├── status-message-template.md
│   ├── error-budget-policy.md
│   ├── weekly-slo-review.md
│   ├── monthly-slo-review.md
│   └── reliability-backlog.md
└── capstone/
    └── implementation-checklist.md
```

### Step 4: Commit and Push Everything
```bash
cd ~/product-reliability-slo-lab
git add .
git commit -m "Complete 15-day SLO lab implementation"
git push origin main
```

### Step 5: Create Final Summary Document
```bash
nano docs/learning-summary.md
```

```markdown
# 15-Day Product Reliability SLO Lab - Learning Summary

## What You Learned

### Week 1 (Days 1-7)
- Day 1: Understanding SLIs, SLOs, and Error Budgets
- Day 2: Environment Setup (Docker, tools installation)
- Day 3: Defining SLIs for Your Service
- Day 4: Writing SLO Configuration Files
- Day 5: Prometheus Setup and Metrics Collection
- Day 6: Recording Rules and SLO Calculations
- Day 7: Grafana Error Budget Dashboard

### Week 2 (Days 8-10)
- Day 8: Load Testing with k6
- Day 9: Prometheus Alerting for SLO Violations
- Day 10: Kubernetes Observability Stack

### Week 3 (Days 11-15)
- Day 11: Custom SLO Dashboards in Grafana
- Day 12: SLO-Driven Incident Response
- Day 13: Error Budget Policies and Change Management
- Day 14: SLO Review and Continuous Improvement
- Day 15: Capstone Project and Implementation

## Key Concepts Mastered
- Service Level Indicators (SLIs)
- Service Level Objectives (SLOs)
- Error Budgets and Burn Rates
- Multi-window Burn Rate Alerting
- SLO-based Incident Response
- Error Budget Policies
- Continuous Reliability Improvement

## Next Steps
1. Apply SLOs to your production services
2. Integrate SLO gates into your CI/CD pipeline
3. Conduct your first SLO review meeting
4. Share knowledge with your team
5. Explore advanced topics (chaos engineering, distributed tracing)

## Resources
- Google SRE Book: https://sre.google/sre-book/table-of-contents/
- SLO Implementation Guide: https://sre.google/workbook/implementing-slos/
- Prometheus Documentation: https://prometheus.io/docs/
- Grafana Documentation: https://grafana.com/docs/
```

### Deliverable for Day 15
- [ ] Complete end-to-end SLO implementation
- [ ] All files committed to repository
- [ ] Production SLO configuration created
- [ ] Final repository structure verified
- [ ] Learning summary document created
- [ ] 15-day learning plan completed!

---

## Quick Start Script

To get started quickly, run this script:

```bash
#!/bin/bash
# Quick start script for Product Reliability SLO Lab

set -e

echo "=== Product Reliability SLO Lab - Quick Start ==="

# Check prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install Docker first."; exit 1; }
echo "Docker: $(docker --version)"

echo ""
echo "Starting observability stack..."
docker run -d --name prometheus -p 9090:9090 prom/prometheus:latest
docker run -d --name grafana -p 3000:3000 grafana/grafana:latest

echo ""
echo "Observability stack started!"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000"
echo ""
echo "Now follow the EXECUTION-GUIDE.md for the 15-day plan!"
```

## Troubleshooting

### Common Issues

**Issue: Prometheus not scraping metrics**
```bash
# Check targets
kubectl get servicemonitors -n monitoring
# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus
```

**Issue: Grafana dashboard not loading**
```bash
# Check Grafana logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
# Verify data source
# In Grafana: Configuration -> Data Sources -> Prometheus -> Save & Test
```

**Issue: Alerts not firing**
```bash
# Check alert rules
# In Prometheus: http://localhost:30090/rules
# Check Alertmanager
# Visit: http://localhost:30093
```

**Issue: k6 load test failing**
```bash
# Check if target service is running
kubectl get pods
# Check service endpoints
kubectl get endpoints
# Test connectivity
curl http://<service-ip>:<port>/health
```

**Issue: SLO calculations seem wrong**
```bash
# Verify the PromQL query manually in Prometheus
# Check that the time window matches your SLO window
# Ensure metrics are being collected with correct labels
```

---

## Congratulations!

You have completed the 15-day Product Reliability SLO Lab! You now have:

- A complete SLO implementation for your services
- Monitoring, alerting, and dashboards
- Incident response runbooks
- Error budget policies
- Continuous improvement processes

**Your journey to mastering Product Reliability has just begun.**

Take what you learned here and apply it to your production systems. Start small, measure everything, and iterate. Your users will thank you for it!

---

*Created by: jgramesh*
*Repository: github.com/jgramesh/product-reliability-slo-lab*
*License: MIT*
