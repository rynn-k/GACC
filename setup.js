const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

fs.mkdirSync(path.join(__dirname, 'models'), { recursive: true });

execSync(
    'pip install huggingface_hub && python3 -c "' +
    'from huggingface_hub import hf_hub_download;' +
    'hf_hub_download(\'SmilingWolf/wd-swinv2-tagger-v3\', \'model.onnx\', local_dir=\'models\');' +
    'hf_hub_download(\'SmilingWolf/wd-swinv2-tagger-v3\', \'selected_tags.csv\', local_dir=\'models\')' +
    '"',
    { stdio: 'inherit' }
);

console.log('Setup complete.');
