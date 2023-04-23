#! /usr/bin/env node 
import inquirer from 'inquirer';
import { exec } from 'child_process';

console.log(">_ This CLI tool deletes all node_module folders in this directory and all subdirectories");
console.log(">_ Please make sure you are running this in the correct directory");

inquirer
  .prompt([
    {
      type: 'confirm',
      name: 'confirmContinue',
      message: 'Continue?'
    }
  ])
  .then(({ confirmContinue }) => {
    if (!confirmContinue) process.exit(0);

    console.log(">_ Please check that the following node_module folders are safe to delete:");

    exec("find . -name 'node_modules' -type d -prune -exec du -hs '{}' +", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }

      let totalSize = 0;

      const splitLines = stdout.split('\n').map((line, lineNum, array) => {
        if (lineNum === array.length - 1) return '>_ Please verify:'

        const [ size, path ] = line.split('\t');
        const sizeUnit = size.charAt(-1);
        totalSize += Number(size.slice(0, size.length - 1));

        return `>_ ${lineNum + 1}. ${path} > Size: ${size}`
      });

      if (splitLines.length === 1) {
        console.log('>_ No node_modules found');
        process.exit(0);
      }

      const rejoinedLines = splitLines.join('\n');
      
      console.log(rejoinedLines);
      console.log(`>_ ${totalSize} MB to be freed`);

      inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'confirmDelete',
            message: `Delete these --${splitLines.length - 1}-- node_modules?`
          }
        ])
        .then(({ confirmDelete }) => {
          if (!confirmDelete) process.exit(0);

          exec("find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }

            console.log(`Deleted ${splitLines.length - 1} node_modules`);
            console.log(`>_ ${totalSize} MB to freed`);
        });
        });
      

  });
    
  })
  .catch((error) => {
    if (error.isTtyError) {
      
      console.error("Prompt couldn't be rendered in the current environment");
    } else {
      console.error("Something else went wrong");
    }
  });