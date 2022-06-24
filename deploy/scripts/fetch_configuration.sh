#!/usr/bin/env bash

export VAULT_ADDR=$1
export VAULT_TOKEN=$2
DEPLOY_ENV=$3
APP_BASE_NAME=$4
DOCKER_BRANCH=$5

DEST_PATH=/opt/secrets

vault kv get -format=json -field=data /${APP_BASE_NAME}/${DEPLOY_ENV}/default/green \
  | jq -r '. | to_entries | map("\(.key)=\(.value)")[]' \
  > ${DEST_PATH}/${APP_BASE_NAME}-${DEPLOY_ENV}-${DOCKER_BRANCH}-build-vault.env
