const { createCanvas, loadImage } = require('canvas');

const axios = require('axios')
const fs = require('fs-extra')
const dayjs = require('dayjs');
const dotenv = require('dotenv').config({ path: '.env' })

async function requestNews() {
    try {
        const { data } = await axios.get('http://apis.juhe.cn/fapigx/bulletin/query', {
            params: {
                key: process.env.API_KEY
            }
        })
        console.log(process.env.API_KEY);
        console.log('请求数据成功');
        return data
    } catch (error) {
        console.log(error);
        console.log('请求数据失败');
    }
}
function chunkArray(arr, chunkSize) {
    let result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
    }
    return result;
}


function getDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 月份从0开始，因此要加1
    const date = today.getDate();

    return (`${year}年${month}月${date}日`);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    // 字符分隔为数组
    var arrText = text.split('');
    var line = '';

    for (var n = 0; n < arrText.length; n++) {
        var testLine = line + arrText[n];
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = arrText[n];
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}
async function create() {
    // 请求数据
    const { result: { list } } = await requestNews()
    const listChunk = chunkArray(list, 5)
    console.log('正在生成文件夹')
    const date = dayjs().format('YYYYMD')
    const folderPath = `./gen/${date}`
    if (fs.pathExistsSync(folderPath)) {
        fs.removeSync(folderPath)
    }
    fs.ensureDirSync(folderPath)
    console.log('正在生成数据...');

 

    for (let key = 0; key < listChunk.length; key++) {

        // 创建画布
        const image = await loadImage('./rawMaterial/dailyShare.jpg');
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // 绘制原始图像
        ctx.drawImage(image, 0, 0);

        // 设置字体样式
        ctx.font = 'bold 35px sans-serif';
        ctx.fillStyle = 'black';

        // 在画布上绘制文本
        // 绘画日期

        ctx.fillText(getDate(), image.width / 2 - 120, 420);

        ctx.fillStyle = 'black';

        for (const i in listChunk[key]) {
            ctx.font = 'bold 40px sans-serif';
            ctx.fillText(`${Number(i) + 1}. ${listChunk[key][i].title}`, 130, 500 + i * 220);
            ctx.font = '500 35px sans-serif';
            ctx.fillStyle = 'black';
            wrapText(ctx, listChunk[key][i].digest, 130, 500 + i * 220 + 55, image.width - 260, 55)
        }

        // 将合成图像保存到文件
        const buffer = canvas.toBuffer('image/png');

        fs.writeFileSync(`${folderPath}/${key+1}.png`, buffer);
        console.log(`生成第${key + 1}张图片完成，位置在${folderPath}/${key+1}.png`);
    }
console.log(`任务完成`)
}

create();
