if ! command -v git
  then
    echo "git not installed, can not set up local gitconfig"
    exit 1
  else
    git config --local include.path ../.gitconfig
    exit 0
fi