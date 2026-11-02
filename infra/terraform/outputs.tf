output "application_url" {
  description = "Public Ethos URL after the first deployment."
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository receiving immutable application images."
  value       = aws_ecr_repository.app.repository_url
}

output "github_deploy_role_arn" {
  description = "Store this as the GitHub Actions AWS_DEPLOY_ROLE_ARN secret."
  value       = aws_iam_role.github_deploy.arn
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.app.name
}
