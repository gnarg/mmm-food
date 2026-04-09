{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { self, nixpkgs, systems, flake-utils }:
    flake-utils.lib.eachDefaultSystem
    (system:
      let
        pkgs = import nixpkgs { system = system; config.allowUnfree = true; };
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            git
            nodejs_24
          ];

          # Environment variables for Python packages
          shellHook = ''
            export EDITOR=/usr/bin/vim
          '';
        };
      }
    );
}
