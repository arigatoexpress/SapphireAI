# Backup & Disaster Recovery Plan

## Automated Backups
- **Database**: Daily snapshots via Cloud SQL automated backups
- **Configuration**: Git-based version control
- **Infrastructure**: Terraform state backups

## Recovery Procedures

### Service Outage (< 5 minutes)
1. Check pod status: `kubectl get pods -n trading`
2. Restart failed pods: `kubectl delete pod <pod-name>`
3. Check HPA: `kubectl get hpa -n trading`

### Load Balancer Issues
1. Check ingress: `kubectl get ingress -n trading`
2. Verify certificate: `kubectl get managedcertificate -n trading`
3. Recreate ingress if needed

### Database Issues
1. Check Cloud SQL instance status
2. Failover to read replica if available
3. Restore from automated backup (RTO: 1 hour)

### Complete Infrastructure Failure
1. Terraform apply from latest state
2. Restore from backups
3. Update DNS if IPs change
4. Verify all services

## Monitoring Alerts
- Pod restarts > 3 in 5 minutes
- CPU usage > 90% for 5 minutes
- Memory usage > 95% for 2 minutes
- API response time > 5 seconds
- Error rate > 5%

## RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 1 hour for full service
- **RPO (Recovery Point Objective)**: 1 hour for data
