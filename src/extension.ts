'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, Position } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.css2inlinestyle', () => {
    let dashRegex = new RegExp('([^\s\n])-(.)'),
      prefixRegex = /(^-[^-]+-)|[\s\n]-[^-]+-/g,
      ruleRegex = new RegExp('([^:]+): ?(.+?);(\n)?([\s ]*})?');

    // The code you place here will be executed every time your command is executed
    let editor = window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file opened.');
      return;
    }

    let selection = editor.selection;
    if (!selection) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    let text = editor.document.getText(selection);
    if (!text.length) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    editor.edit(function (editBuilder) {
      let previousRules = {};
      // remove selection
      editBuilder.delete(selection);

      text = text.replace(new RegExp(ruleRegex.source, 'g'), function (matchString) {
        let match = matchString.match(ruleRegex),
          ruleName = match[1],
          escapedName = '',
          ruleValue = match[2],
          isLast = !match[3] || Boolean(match[4]),
          replaceText = '';

        // remove prefix
        ruleName = ruleName.replace(prefixRegex, '');

        // if dashed regex, remove the dash and convert next letter in UpperCase
        ruleName = ruleName.replace(new RegExp(dashRegex, 'g'), function (nameMatchString) {
          let nameMatch = nameMatchString.match(dashRegex);
          return nameMatch[1] + nameMatch[2].toUpperCase();
        });

        // check if the rule is already
        // in this case, check the rule value
        // if the two rules are equals, don't write the second one
        // otherwise display a warning message
        escapedName = ruleName.replace(/\s/g, '');
        if (escapedName in previousRules) {
          let previousValue = previousRules[escapedName];
          if (previousValue === ruleValue) {
            return '';
          } else {
            vscode.window.showWarningMessage('The rule "' + escapedName + '" is present more than 1 time but with different values. The two rules have been kept, you need to merge them.');
          }
        }

        previousRules[escapedName] = ruleValue;

        replaceText = ruleName + ': \'' + ruleValue + '\'';
        if (!isLast) {
          replaceText += ',\n';
        }

        return replaceText;
      });

      editBuilder.insert(selection.start, text);

      return true;
    });
  });

  context.subscriptions.push(disposable);



  context.subscriptions.push(vscode.commands.registerCommand('extension.inlinestyle2css', () => {
    let upCaseRegex = new RegExp('[A-Z]'),
      ruleContentRegex = new RegExp('((?:\s)*[^:]+): ?(?:"|\')?(.+?)?(?:"|\')?,?'),
      ruleRegex = new RegExp('(?:' + ruleContentRegex.source + '(\n)([\s ]*})?)|(?:' + ruleContentRegex.source + '$)');

    // The code you place here will be executed every time your command is executed
    let editor = window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file opened.');
      return;
    }

    let selection = editor.selection;
    if (!selection) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    let text = editor.document.getText(selection);
    if (!text.length) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    editor.edit(function (editBuilder) {
      // remove selection
      editBuilder.delete(selection);

      text = text.replace(new RegExp(ruleRegex.source, 'g'), function (matchString) {
        let match = matchString.match(ruleRegex),
          ruleName = match[1] ||  match[5],
          escapedName = '',
          ruleValue = match[2] || match[6],
          isLast = Boolean(match[5]),
          replaceText = '';

        // if dashed regex, remove the dash and convert next letter in UpperCase
        ruleName = ruleName.replace(new RegExp(upCaseRegex, 'g'), function (nameMatchString) {
          let nameMatch = nameMatchString.match(upCaseRegex);
          return '-' + nameMatch[0].toLowerCase();
        });

        replaceText = ruleName + ': ' + ruleValue + ';';
        if (!isLast) {
          replaceText += '\n';
        }

        return replaceText;
      });

      editBuilder.insert(selection.start, text);

      return true;
    });
  }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
