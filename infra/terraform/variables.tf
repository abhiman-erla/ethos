variable "project_name" {
  description = "Name used to prefix AWS resources."
  type        = string
  default     = "ethos"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub repository in owner/repository format for OIDC trust."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must use owner/repository format."
  }
}

variable "github_oidc_subjects" {
  description = "Optional exact GitHub OIDC subject claims. Use immutable owner/repository IDs for repositories configured for immutable claims."
  type        = list(string)
  default     = []
}

variable "create_github_oidc_provider" {
  description = "Create GitHub's account-wide OIDC provider. Set false if it already exists."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN when create_github_oidc_provider is false."
  type        = string
  default     = ""
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "ethos"
}

variable "db_username" {
  description = "PostgreSQL administrator username."
  type        = string
  default     = "ethos_admin"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "container_cpu" {
  description = "Fargate CPU units."
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Fargate memory in MiB."
  type        = number
  default     = 512
}
