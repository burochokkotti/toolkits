#!/usr/bin/env node

// Simple test for MCP server
import { spawn } from 'child_process';

const PYTHON_PATH = '/Users/somnathchakraborty/Paytm/openmemory/bin/python3';

function testPython() {
  return new Promise((resolve, reject) => {
    const pythonScript = `import sys
sys.path.append('${process.cwd()}')
from simple_memory import memory
import json
memories = memory.get_all()
print(json.dumps({"status": "success", "count": len(memories)}))`;
    
    console.log('Testing Python script:');
    console.log(pythonScript);
    console.log('---');
    
    const child = spawn(PYTHON_PATH, ['-c', pythonScript]);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      console.log(`Exit code: ${code}`);
      console.log(`STDOUT: ${stdout}`);
      console.log(`STDERR: ${stderr}`);
      
      if (code === 0) {
        resolve(JSON.parse(stdout.trim()));
      } else {
        reject(new Error(stderr || stdout));
      }
    });
  });
}

testPython()
  .then(result => {
    console.log('✅ Test passed:', result);
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
  });