/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, React, Toasts } from "@webpack/common";

export let isShiftHeld = false;

const settings = definePluginSettings({
    pasteMaskedByDefault: {
        type: OptionType.BOOLEAN,
        description: "Paste masked links by default",
        default: false
    },

    useShiftKeyToInvert: {
        type: OptionType.BOOLEAN,
        description: "Invert the paste behaviour when shift is held",
        default: true
    },

    suppressEmbeds: {
        type: OptionType.BOOLEAN,
        description: "Suppress embeds when pasting masked links by surrounding them with < >",
        default: false
    }
});

function showToast(text: string) {
    Toasts.show({
        message: text,
        id: Toasts.genId(),
        type: Toasts.Type.SUCCESS,
        options: {
            position: Toasts.Position.BOTTOM
        }
    });
}

const c = classNameFactory("vc-toolbox-maskpaste-");

export default definePlugin({
    name: "MaskedPasteOptions",
    authors: [Devs.Suffocate],
    description: "Allows you to set masked URL paste behaviour (not compatible with NoMaskedUrlPaste)",

    contextMenus: {
        "vc-toolbox": (children, props) => {
            const [pasteMaskedByDefaultChecked, setPasteMaskedByDefaultChecked] = React.useState(settings.store.pasteMaskedByDefault);
            const [shiftKeyInvertChecked, setShiftKeyInvertChecked] = React.useState(settings.store.useShiftKeyToInvert);
            const [suppressEmbedsChecked, setSuppressEmbedsChecked] = React.useState(settings.store.suppressEmbeds);
            const [shiftToggleLabel, setShiftToggleLabel] = React.useState(settings.store.pasteMaskedByDefault ? "Shift to Paste Unmasked" : "Shift to Paste Masked");

            children.push(
                <Menu.MenuGroup
                    label={"Masked URL Options"}
                    id={c("menu-group")}
                >
                    <Menu.MenuCheckboxItem
                        checked={pasteMaskedByDefaultChecked}
                        label={"Paste Masked Links"}
                        action={() => {
                            setPasteMaskedByDefaultChecked(!pasteMaskedByDefaultChecked);
                            settings.store.pasteMaskedByDefault = !settings.store.pasteMaskedByDefault;
                            setShiftToggleLabel(settings.store.pasteMaskedByDefault ? "Shift to Paste Unmasked" : "Shift to Paste Masked");
                            showToast(settings.store.pasteMaskedByDefault ? "Pasting masked links by default" : "Pasting unmasked links by default");
                        }}
                        id={c("default-masked")}
                    />
                    <Menu.MenuCheckboxItem
                        checked={shiftKeyInvertChecked}
                        label={shiftToggleLabel}
                        action={() => {
                            setShiftKeyInvertChecked(!shiftKeyInvertChecked);
                            settings.store.useShiftKeyToInvert = !settings.store.useShiftKeyToInvert;
                            showToast(settings.store.useShiftKeyToInvert ? settings.store.pasteMaskedByDefault ? "Holding shift will paste unmasked links" : "Holding shift will paste masked links" : "Holding shift will have no effect");
                        }}
                        id={c("shift-invert")}
                    />
                    <Menu.MenuCheckboxItem
                        checked={suppressEmbedsChecked}
                        label={"Suppress Embeds"}
                        action={() => {
                            setSuppressEmbedsChecked(!suppressEmbedsChecked);
                            settings.store.suppressEmbeds = !settings.store.suppressEmbeds;
                            showToast(settings.store.suppressEmbeds ? "Suppressing embeds when pasting masked links" : "Not suppressing embeds when pasting masked links");
                        }}
                        id={c("suppress-embeds")}
                    />
                </Menu.MenuGroup>
            );
        }
    },

    patches: [
        {
            find: ".selection,preventEmojiSurrogates:",
            replacement: [
                // will not error if NoMaskedUrlPaste is active
                {
                    match: /(return!1;if\(.+?)\)\{/,
                    replace: "$1 && $self.pasteMasked()){",
                },
                {
                    match: /(\i)\.target/,
                    replace: "$self.suppressEmbeds() ? `<${$1.target}>` : $1.target"
                }
            ]
        }
    ],
    settings,

    suppressEmbeds: function () {
        return settings.store.suppressEmbeds;
    },

    pasteMasked: function () {
        if (settings.store.useShiftKeyToInvert) {
            return isShiftHeld ? !settings.store.pasteMaskedByDefault : settings.store.pasteMaskedByDefault;
        } else {
            return settings.store.pasteMaskedByDefault;
        }
    },

    start: async function () {
        document.addEventListener("keydown", e => {
            isShiftHeld = e.shiftKey;
        });
        document.addEventListener("keyup", e => {
            isShiftHeld = e.shiftKey;
        });
    },

    stop: function () {
        document.removeEventListener("keydown", e => {
            isShiftHeld = e.shiftKey;
        });
        document.removeEventListener("keyup", e => {
            isShiftHeld = e.shiftKey;
        });
    }
});
