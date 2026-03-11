# Branch strategy

The project follows the GitFlow branching model.

```
master
 └── develop
      ├── feature/xy
           └── hotfix/xy
```

## Branches

- **master** – stable, production-ready code only. Never commit directly.
- **develop** – active development branch. All features are merged here.
- **feature/xy** – one branch per issue, branched off from `develop`. Merged back via pull request.
- **release** – optional, used for release preparation before merging into `master`.
- **hotfix/xy** – branched off from `master` for urgent fixes, merged back into both `master` and `develop`.

## Example feature branch names

```
feature/authentication
feature/warehouse-crud
feature/grid-editing
hotfix/login-token-expiry