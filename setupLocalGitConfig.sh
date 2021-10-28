if ! command -v git
  then
    echo "git not installed, can not set up local gitconfig"
    exit
  else
    git config --local include.path ../.gitconfig
    exit
fi