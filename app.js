const { Command } = require('commander');
const aioInstallCommand = require("./commands/aioinstall");


const program = new Command();

program
    .name('valetudo-helper-miioota')
    .description('CLI tool to install firmwares via miio local OTA')
    .version('2022.04.0');


program.command('install-firmware')
    .description('Install a rooted firmware on an unprovisioned robot')
    .argument('<filename>', 'path to the rooted firmware image .pkg')
    .action((filePath) => {
        aioInstallCommand(filePath).catch(err => {
            console.error("Error during execution of install command", err);
            process.exit(-1);
        })
    });

program.parse();
