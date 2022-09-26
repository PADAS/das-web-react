output "cluster_proxy_endpoint" {
  value = data.terraform_remote_state.earthranger_app_infra.outputs.proxy_endpoint
}

output "cluster_b64_encoded_proxy_ca_certificate" {
  value = data.terraform_remote_state.earthranger_app_infra.outputs.b64_encoded_proxy_ca_certificate
}

