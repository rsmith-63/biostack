# Initialize and Push Biostack to GitHub

Run the following commands in your terminal to initialize your local `~/biostack` directory as a Git repository and push it to your GitHub account.

```bash
# Navigate to your local project directory
cd ~/biostack

# Initialize the directory as a Git repository
git init

# Stage all files in the directory for the first commit
git add .

# Create the initial commit
git commit -m "Initial commit for Biostack"

# Ensure your default branch is named 'main'
git branch -M main

# Link your local repository to the GitHub repository
git remote add origin [https://github.com/rsmith-63/biostack.git](https://github.com/rsmith-63/biostack.git)

# Push the code to GitHub and set upstream tracking
git push -u origin main