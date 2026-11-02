# Ethos Operations Runbook

This runbook covers the first checks for a failed deployment or unavailable service.

## Service is unavailable

1. Check the Application Load Balancer target health in AWS.
2. Check the ECS service events for image-pull, secret-access, or health-check failures.
3. Open the `/ecs/ethos-production` CloudWatch log group and filter by the affected task ID.
4. Confirm the RDS instance is available and its security group only accepts port `5432` from the ECS task security group.
5. Check `/health` for process health and `/ready` for application-to-database connectivity.

## Deployment failed

1. Open the failed `Deploy to AWS` GitHub Actions run and identify whether the failure happened during image push, task registration, or service stabilization.
2. Inspect ECS service events and stopped-task reasons.
3. Verify the GitHub `AWS_DEPLOY_ROLE_ARN` secret matches the Terraform `github_deploy_role_arn` output.
4. Verify the GitHub `AWS_REGION` repository variable matches the Terraform region.

## Roll back

1. In ECS, identify the previous healthy task-definition revision.
2. Update the service to that revision:

   ```bash
   aws ecs update-service \
     --cluster ethos-production \
     --service ethos-production \
     --task-definition ethos-production:PREVIOUS_REVISION
   ```

3. Wait for stability:

   ```bash
   aws ecs wait services-stable \
     --cluster ethos-production \
     --services ethos-production
   ```

4. Record the rollback in Ethos with the `rolled_back` status and a short incident note.

## Database pressure

1. Review RDS CPU, free storage, connections, and read/write latency in CloudWatch.
2. Check application logs for repeated query failures or connection timeouts.
3. If connection count is the constraint, reduce task concurrency or introduce RDS Proxy before increasing the database size.

## Useful commands

```bash
aws ecs describe-services --cluster ethos-production --services ethos-production
aws ecs list-tasks --cluster ethos-production --service-name ethos-production
aws logs tail /ecs/ethos-production --since 30m --follow
curl -fsS http://APPLICATION_URL/health
curl -fsS http://APPLICATION_URL/ready
```
