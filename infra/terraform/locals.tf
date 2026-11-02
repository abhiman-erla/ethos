locals {
  name = "${var.project_name}-${var.environment}"

  oidc_provider_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn

  github_oidc_subjects = length(var.github_oidc_subjects) > 0 ? var.github_oidc_subjects : [
    "repo:${var.github_repository}:environment:production"
  ]

  common_tags = {
    Application = var.project_name
  }
}
