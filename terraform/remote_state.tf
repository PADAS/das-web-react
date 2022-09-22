data "terraform_remote_state" "earthranger_app_infra" {
  backend   = "gcs"
  workspace = "dev"
  config = {
    bucket = "earthranger-app-infra-terraform-state-540d878e"
  }
}
