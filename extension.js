import Gio from "gi://Gio";
import GLib from "gi://GLib";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { getLocaleCode, translate } from "./translations.js";

export default class CatoVpnExtension extends Extension {
  enable() {
    this._locale = getLocaleCode(GLib.get_language_names());

    this._indicator = new PanelMenu.Button(0.5, "Cato VPN Indicator", false);

    this._icon = new St.Icon({
      icon_name: "network-vpn-disabled-symbolic",
      style_class: "system-status-icon",
    });
    this._indicator.add_child(this._icon);

    this._statusItem = new PopupMenu.PopupMenuItem(
      translate(this._locale, "statusChecking"),
      {
        reactive: false,
      },
    );
    this._indicator.menu.addMenuItem(this._statusItem);

    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._actionItem = new PopupMenu.PopupMenuItem(
      translate(this._locale, "connect"),
    );
    this._actionItem.connect("activate", () => this._toggleVpn());
    this._indicator.menu.addMenuItem(this._actionItem);

    Main.panel.addToStatusArea("cato-vpn-indicator", this._indicator);

    this._isConnected = false;

    this._checkStatus();
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      10,
      () => {
        this._checkStatus();
        return GLib.SOURCE_CONTINUE;
      },
    );
  }

  disable() {
    if (this._timeoutId) {
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }

  async _runCommand(args) {
    try {
      let proc = new Gio.Subprocess({
        argv: ["cato-sdp"].concat(args),
        flags:
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
      });
      proc.init(null);

      return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (obj, res) => {
          try {
            let [, stdout, stderr] = obj.communicate_utf8_finish(res);
            if (stderr && stderr.trim().length > 0) {
              resolve(stderr);
            }
            resolve(stdout || "");
          } catch (e) {
            reject(e);
          }
        });
      });
    } catch (e) {
      logError(e, translate(this._locale, "errorExecuting"));
      return "";
    }
  }

  async _checkStatus() {
    let output = await this._runCommand(["status"]);

    if (output.includes("disconnected") || output.trim() === "") {
      this._isConnected = false;
      this._icon.icon_name = "network-vpn-disabled-symbolic";
      this._statusItem.label.text = translate(
        this._locale,
        "statusDisconnected",
      );
      this._actionItem.label.text = translate(this._locale, "connect");
    } else if (
      output.includes("STATE_AUTHENTICATED") ||
      output.includes("tunnel ip")
    ) {
      this._isConnected = true;
      this._icon.icon_name = "network-vpn-symbolic";
      this._statusItem.label.text = translate(this._locale, "statusConnected");
      this._actionItem.label.text = translate(this._locale, "disconnect");
    }
  }

  async _toggleVpn() {
    if (this._isConnected) {
      this._statusItem.label.text = translate(this._locale, "disconnecting");
      await this._runCommand(["stop"]);
    } else {
      this._statusItem.label.text = translate(this._locale, "connecting");
      await this._runCommand(["start"]);
    }
    this._checkStatus();
  }
}
