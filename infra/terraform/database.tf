resource "random_password" "database" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.public[*].id
  tags       = { Name = local.name }
}

resource "aws_db_instance" "main" {
  identifier = local.name

  engine                 = "postgres"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 50
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.database.result
  port                   = 5432
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 7
  deletion_protection     = false
  skip_final_snapshot     = true
  apply_immediately       = true

  tags = { Name = local.name }
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${local.name}/database-url"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgres://%s:%s@%s:%s/%s",
    var.db_username,
    random_password.database.result,
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    var.db_name
  )
}
