#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ink_1 = require("ink");
var meow_1 = require("meow");
var app_js_1 = require("./app.js");
var cli = (0, meow_1.default)("\n\tUsage\n\t  $ kimi-chat-cli\n\n\tOptions\n\t\t--name  Your name\n\n\tExamples\n\t  $ kimi-chat-cli --name=Jane\n\t  Hello, Jane\n", {
    importMeta: import.meta,
    flags: {
        name: {
            type: 'string',
        },
    },
});
(0, ink_1.render)(<app_js_1.default name={cli.flags.name}/>);
