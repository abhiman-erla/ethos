# Security Policy

Do not open public issues containing credentials, database URLs, account IDs, or vulnerability details.

## Controls demonstrated

- GitHub Actions authenticates to AWS through short-lived OIDC credentials.
- The ECS deployment role is restricted to ECR, ECS, and the two task roles it may pass.
- The database is not publicly accessible and accepts traffic only from the application security group.
- The database connection string is injected from AWS Secrets Manager.
- RDS storage is encrypted and backups are retained for seven days.
- Containers run as a non-root user with a read-only root filesystem.
- CI runs dependency auditing and high/critical container vulnerability scanning.
- ECR scans images on push and expires older images.

For a real production deployment, add TLS with ACM, AWS WAF, private application subnets with VPC endpoints, secret rotation, and an SNS destination for CloudWatch alarms.
