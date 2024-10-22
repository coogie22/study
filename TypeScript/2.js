const { exec } = require('child_process');

// 명령어 실행 함수
function runCommand() {
    exec('echo %date% %time%', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
        }
        console.log(stdout);
    });
}

setInterval(runCommand, 500);
