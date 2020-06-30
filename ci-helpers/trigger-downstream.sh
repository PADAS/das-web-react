#!/bin/bash

PROJECT_NAME=$1
BRANCH_NAME=$2

# Token for triggering downstream builds.
# This should be in a Circle CI Organization Context.
if [[ "${DOWNSTREAM_TRIGGER_TOKEN}" == "" ]]
then
   echo "I don't have a value for DOWNSTREAM_TRIGGER_TOKEN, so I won't do anything."
fi

# Circle CI Organization Slug.
# Default to using the Orgnization slug of the current project.
CI_ORG=${CIRCLE_PROJECT_USERNAME:-PADAS}

# I don't have a reliable place to get the VCS value.
VCS_SLUG=gh

# Build the project slug for the project identified by arguments.
PROJECT_SLUG=${VCS_SLUG}/${CI_ORG}/${PROJECT_NAME}
echo $PROJECT_SLUG

if [[ $BRANCH_NAME == "" ]]
then
  curl -X GET https://circleci.com/api/v2/project/${PROJECT_SLUG}/pipeline \
   --header 'Accept: application/json' \
   --header "Circle-Token: ${DOWNSTREAM_TRIGGER_TOKEN}" | jq '.' # | jq '.items[].vcs.branch'
else
  echo branch name is $BRANCH_NAME
fi


# TODO: For now we'll just read header output for debugging. 
# In the future we can add more graceful handling of the result.
curl -v -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' \
  --header "Circle-Token: ${DOWNSTREAM_TRIGGER_TOKEN}" \
  --data "{\"branch\": \"$BRANCH_NAME\"}" \
https://circleci.com/api/v2/project/${PROJECT_SLUG}/pipeline 


