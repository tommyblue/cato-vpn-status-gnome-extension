# Cato VPN Indicator (GNOME Shell Extension)

This GNOME Shell extension adds a panel indicator to monitor and control the Cato VPN client from the top bar.

It uses the `cato-sdp` command-line tool to:

- check current VPN status,
- start the VPN connection,
- stop the VPN connection.

The indicator updates automatically every few seconds and provides a simple menu action to connect or disconnect.

## What It Does

At runtime, the extension:

- creates a panel menu button in the GNOME top bar,
- shows a status line (`Disconnected`, `Connected`, or transitional state),
- exposes an action item (`Connect` or `Disconnect`),
- polls VPN status every few seconds,
- updates icon and labels based on `cato-sdp status` output,
- runs `cato-sdp start` or `cato-sdp stop` when the action is clicked.

## How It Works

The core logic is in [extension.js](extension.js):

- `enable()`
	- builds the UI (`PanelMenu.Button`, `St.Icon`, menu items),
	- adds the indicator via `Main.panel.addToStatusArea(...)`,
	- starts periodic status checks with `GLib.timeout_add_seconds(..., 5, ...)`.
- `disable()`
	- removes the periodic timer,
	- destroys the panel indicator.
- `_runCommand(args)`
	- executes `cato-sdp <args>` asynchronously via `Gio.Subprocess`,
	- returns command output for state parsing.
- `_checkStatus()`
	- parses `cato-sdp status` output,
	- marks VPN as connected/disconnected,
	- updates icon and menu labels accordingly.
- `_toggleVpn()`
	- calls `start` if disconnected,
	- calls `stop` if connected,
	- triggers an immediate follow-up status refresh.

## Requirements

- Linux with GNOME Shell 50
- `cato-sdp` CLI installed and available in `PATH`
- A working Cato VPN setup on the machine

To verify `cato-sdp` is available:

```bash
cato-sdp status
```

If the command is not found, install/configure the Cato client first.

## Installation

### Option 1: Local Manual Install (current user)

1. Create the extension directory:

	 ```bash
	 mkdir -p ~/.local/share/gnome-shell/extensions/cato-vpn-status@tommyblue.github.com
	 ```

2. Copy these files into that directory:

	 - `extension.js`
	 - `metadata.json`

3. Restart GNOME Shell:

	 - On Xorg: press `Alt+F2`, type `r`, then press Enter.
	 - On Wayland: log out and log back in.

4. Enable the extension running the "Extensions" app or manually:

	 ```bash
	 gnome-extensions enable cato-vpn-status@tommyblue.github.com
	 ```

5. Confirm it is enabled:

	 ```bash
	 gnome-extensions list --enabled | grep cato-vpn-status@tommyblue.github.com
	 ```

### Option 2: Enable from existing checkout

If this repository is already located at:

`~/.local/share/gnome-shell/extensions/cato-vpn-status@tommyblue.github.com`

you only need to restart GNOME Shell (or relogin) and run:

```bash
gnome-extensions enable cato-vpn-status@tommyblue.github.com
```

## Usage

1. Click the VPN icon in the top panel.
2. Read the current status in the first menu line.
3. Click `Connect` or `Disconnect` to toggle the tunnel.
4. The icon and labels update automatically.

## Troubleshooting

- Indicator does not appear:
	- verify extension is enabled with `gnome-extensions list --enabled`,
	- check `metadata.json` has shell version `50`,
	- restart GNOME Shell or relogin.

- Always shown as disconnected:
	- run `cato-sdp status` manually and verify it returns valid output,
	- ensure the current user can run `cato-sdp start/stop/status`.

- Action does nothing:
	- test commands manually:

		```bash
		cato-sdp start
		cato-sdp stop
		```
