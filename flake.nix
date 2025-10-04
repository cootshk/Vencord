{
  description = "simple pnpm flake";
  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/4b13f0723830f7af086a123a5e5e2c5ab91732da";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      with pkgs;
      {
        devShells.default = mkShell {
          buildInputs = [
            nodejs
            yarn
            pnpm
          ];
        };
      }
    );
}
