const medias = {
  audio: false,
  video: {
    facingMode: {
      exact: "environment"
    }
  }
};
const video = document.getElementById("video");
video.autoplay = true;
video.muted = true;
video.playsInline = true;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const promise = navigator.mediaDevices.getUserMedia(medias);
const textArea = document.getElementById("textArea");

let detect_flag = 0;

// import LSD from './lsd/lsd';

promise.then(successCallback)
       .catch(errorCallback);

function successCallback(stream) {
  video.srcObject = stream;
  const FPS = 5;

  // const width = canvas.width*1.5;
  // const height = canvas.height*4;

  let width = video.clientWidth;
  let height = video.clientHeight;

  let videoMat1 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat2 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat3 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat4 = new cv.Mat(height, width, cv.CV_8UC4);

  let outMat = cv.Mat.zeros(height, width, cv.CV_8UC3);

  let read_flag = -1;

  let sum = [0, 0, 0];

  let data1 = [];
  let data2 = [];
  let data3 = [];
  let data4 = [];

  let frame_num = 4;

  canvas.width = width;
  canvas.height = height;

  processVideo();

  function processVideo() {
    try{
      const begin = Date.now();

      if(width != video.clientWidth || height != video.clientHeight){
        width = video.clientWidth;
        height = video.clientHeight;
        canvas.width = width;
        canvas.height = height;
        videoMat1 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat2 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat3 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat4 = new cv.Mat(height, width, cv.CV_8UC4);
        outMat = cv.Mat.zeros(height, width, cv.CV_8UC3);
        read_flag = 0;
      }

      ctx.drawImage(video, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      // ctx.drawImage(video, 0, 0, width, height);

      // videoMatNow = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      videoMat1 = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if(detect_flag<10){
        ; // do nothing
      }
      else if(read_flag<0){
        ; // 何もしない
      }
      else if(read_flag<1){
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }
      else if(read_flag<2){
        videoMat3 = videoMat2.clone();
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }
      else if(read_flag<3){
        videoMat4 = videoMat3.clone();
        videoMat3 = videoMat2.clone();
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }else{
        for(let col=0; col<width;col++){
          for(let row=0; row<height; row++){
            sum = [0, 0, 0];
            data1 = videoMat1.ucharPtr(row,col);
            data2 = videoMat2.ucharPtr(row,col);
            data3 = videoMat3.ucharPtr(row,col);
            data4 = videoMat4.ucharPtr(row,col);
            for(let c=0; c<3; c++){
              sum[c] += data1[c]/frame_num;
              sum[c] += data2[c]/frame_num;
              sum[c] += data3[c]/frame_num;
              sum[c] += data4[c]/frame_num;
            }
            // if(sum[0]>90 & sum[0]<105 & sum[1]<120 & sum[2]>110){ // only iPhone
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            //   // console.log("x:", col, " y:", row, " sum:", sum);
            // }
            // if(80<sum[0] & sum[0]<120 & sum[1]<120 & sum[2]>110){ // loose threshold
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            // }
            if(115<sum[0] & sum[0]<155 & sum[1]<90 & 80<sum[2] & sum[2]<140){ // display
              outMat.ucharPtr(row,col)[0] = sum[0];
              outMat.ucharPtr(row,col)[1] = sum[1];
              outMat.ucharPtr(row,col)[2] = sum[2];
              // console.log("x:", col, " y:", row, " sum:", sum);
            }
            // if(140<sum[0] & sum[0]<220 & sum[1]<120 & 80<sum[2] & sum[2]<160){ // iPhone application
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            // }

            // if(125<sum[0] & sum[0]<165 & sum[1]<90 & 60<sum[2] & sum[2]<120){ // iPhone application
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            // }
          }
        }

        // cv.imshow("canvas", outMat);

        // // hough lines detection
        // houghDetection(outMat, height, width, videoMat1);

        // count pixels
        CountPixels(outMat, height, width, videoMat1);
 
        read_flag = 0;
      }

      detect_flag ++;

      let delay = 1000 / FPS - (Date.now() - begin);
      if(delay<0){
        delay = 0;
      }
      setTimeout(processVideo, delay);
      
    }catch(e){
      location.reload();
    }
  }
}

// detected lines by count pixels(loose)
function CountPixels(tMat, height, width, MatImage){
  // set variables
  let imgMat = MatImage.clone();
  let outMat = tMat.clone();
  let num = width*0.1;
  let cnt = 0;
  let start_x = width;
  let end_x = 0;
  let lines = []; // [startPoint, endPoint]
  let delta = 5;
  let w_list;
  let length_threshold = width*0.5;

  for(let row=10; row<height-10; row++){
    // reset variables
    cnt = 0; // rowで検出されたピクセルをカウント
    start_x = width;
    end_x = 0;
    w_list = [];

    for(let r=row-delta; r<=row+delta; r++){
      if(r>height){
        continue;
      }
      // detect lines
      for(let col=0; col<width; col++){
        if(col in w_list == false){
          data = outMat.ucharPtr(r, col);
          // 検出されているピクセルならカウント
          if(data[0]!=0 || data[1]!=0 || data[2]!=0){
            cnt++;
            w_list.push(col);
            if(col<start_x){
              start_x = col;
            }
            if(col>end_x){
              end_x = col;
            }
          }
        }
      }
    }
    if(cnt>num){
      lines.push([new cv.Point(start_x, row), new cv.Point(end_x, row)]);
    }
  }

  let max_length = 0;
  let max_id = -1;
  let max_y; // 座標
  let ids; // idを記憶
  let places;
  for(let i=0; i<lines.length; i++){ // check longest line
    let tmp = Math.abs(lines[i][0].x-lines[i][1].x);
    if(tmp>max_length){
      max_length = tmp;
      max_id = i;
      max_y = [lines[i][0].y];
      ids = [i];
      if(lines[i][0].y>height/2){
        places = [1];
      }else{
        places = [0];
      }
    }else if(tmp == max_length & tmp!=0){
      max_y.push(lines[i][0].y);
      ids.push(i);
      if(lines[i][0].y>height/2){
        // lower
        places.push(1);
      }else{
        // upper
        places.push(0);
      }
    }
  }
  if(max_id != -1 & max_length>length_threshold){ // if line is detected

    // calculate y
    let cand_y = [];
    let mid_y;
    if(max_y.length > 1){
      // 同じ長さの線が複数存在した場合
      let total = places.reduce(function(sum, element){return sum+element;},0);
      if(total>max_y.length/2){
        // lower
        for(let i=0; i<places.length; i++){
          if(places[i]==1){
            cand_y.push([ids[i], max_y[i]]);
          }
        }
      }else{
        // upper
        for(let i=0; i<places.length; i++){
          if(places[i]==0){
            cand_y.push([ids[i], max_y[i]]);
          }
        }
      }
      // console.log('before:', cand_y);
      // merge_sort(cand_y);
      // console.log('after :', cand_y);
      console.log('cand_y :', cand_y);
      mid_y = lines[cand_y[parseInt(cand_y.length/2)][0]][0].y;
    }else{
      mid_y = lines[max_id][0].y;
    }

    // set variables
    let mid_x = parseInt((lines[max_id][0].x+lines[max_id][1].x)/2);
    // let mid_y = lines[max_id][0].y;
    let tmp_length = max_length/4;
    let diff_length = parseInt(tmp_length/2);
    let l_sum = [0,0,0];
    let r_sum = [0,0,0];
    let l_max = 0;
    let l_idx = 0;
    let r_max = 0;
    let r_idx = 0;

    console.log('mid_y:', mid_y);

    // check left brightness
    for(let i=mid_x-diff_length-2; i<mid_x-diff_length+2; i++){
      let data = imgMat.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        l_sum[j] += data[j]/4;
      }
    }
    // check right brightness
    for(let i=mid_x+diff_length-2; i<mid_x+diff_length+2; i++){
      data = imgMat.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        r_sum[j] += data[j]/4;
      }
    }

    // check color
    for(let i=0; i<3; i++){
      if(l_sum[i]>l_max){
        l_max = l_sum[i];
        l_idx = i;
      }
      if(r_sum[i]>r_max){
        r_max = r_sum[i];
        r_idx = i;
      }
    }

    let tmp_color = ["red", "green", "blue"];
    console.log('count');
    console.log('left color:', l_sum, ' right color:', r_sum);
    console.log('left color:', tmp_color[l_idx], ' right color:', tmp_color[r_idx]);
    // cv.line(imgMat, new cv.Point(mid_x-diff_length-2, mid_y), new cv.Point(mid_x-diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
    // cv.line(imgMat, new cv.Point(mid_x+diff_length-2, mid_y), new cv.Point(mid_x+diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
    // cv.line(imgMat, new cv.Point(lines[max_id][0].x, mid_y), new cv.Point(lines[max_id][1].x, mid_y), new cv.Scalar(255,0,0), thickness=3);
    textArea.innerHTML = ' count:' + String(tmp_color[l_idx]) + ', ' + String(tmp_color[r_idx]);
    Jump(l_idx, r_idx);
  }

  cv.imshow("canvas", imgMat);
}

function Jump(l_color, r_color){
  if(l_color==0 & r_color==0){ //      RR LED1-1
    // to katsurai Lab.
    window.location.href = 'https://mm.doshisha.ac.jp/';
  }
  else if(l_color==0 & r_color==1){ // RG LED1-2
    // to flyby html
    window.location.href = 'https://flyby.co.jp/';
  }
  else if(l_color==0 & r_color==2){ // RB LED2-1
    // stamp1
    window.location.href = 'https://hanako-suzuki.github.io/EXPO-contents.github.io/lot.html';
  }
  else if(l_color==1 & r_color==0){ // GR LED2-2
    // stamp2
    window.location.href = 'https://hanako-suzuki.github.io/EXPO-contents.github.io/stamp.html';
  }
  else if(l_color==1 & r_color==1){ // GG LED3-1
    // photo frame
    window.location.href = 'https://hanako-suzuki.github.io/EXPO-contents.github.io/frame.html';
  }
  else if(l_color==1 & r_color==2){ // GB LED3-2
    // fish frame
    window.location.href = 'https://hanako-suzuki.github.io/EXPO-contents.github.io/fish.html';
  }
  else if(l_color==2 & r_color==0){ // BR LED4-1
    // to LAR html
    window.location.href = 'https://web.tuat.ac.jp/~yu-nakayama/luminaryar.html';
  }
  else if(l_color==2 & r_color==1){ // BG LED4-2
    // to LAR html  <same as BR>
    window.location.href = 'https://knart.theshop.jp/';
  }
  else if(l_color==2 & r_color==2){ // BB LED5
    // to neural html
    window.location.href = 'https://www.neuralmarketing.co.jp/';
  }
}


function fusion(para_lines){
  // 各直線が他の直線と重なっているかを確認し重なっていれば融合
  if(para_lines.length <1){
    return para_lines;
  }

  let fuse_lines = [];
  let fused_list = [];

  for(let i=0; i<para_lines.length; i++){
    if(fused_list.indexOf(i)>-1){
      continue;
    }
    let new_line = para_lines[i].concat();
    for(let j=0; j<para_lines.length; j++){
      if(i != j){
        let tmp = fusion_lines(new_line, para_lines[j]);
        new_line = tmp[0].concat();
        if(tmp[1]==1){
          fused_list.push(j);
        }
      }
    }
    fuse_lines.push(new_line);
  }

  return fuse_lines;
}

function fusion_lines(lineA, lineB){
  const distance = Math.abs(lineA[0].y - lineB[0].y);
  const pA = [Math.min(lineA[0].x, lineA[1].x), Math.max(lineA[0].x, lineA[1].x)];
  const pB = [Math.min(lineB[0].x, lineB[1].x), Math.max(lineB[0].x, lineB[1].x)];
  // const cnt = Math.max(lineA[3], lineB[3]);

  if(distance > 7){
    // ２つの線が十分に離れていれば終了
    return [lineA, 0];
  }
  // if(pA[0] > pB[1]+30 & pB[0] > pA[1]+30){
  //   // 重なっていなければ終了
  //   return [lineA, 0];
  // }

  let tmp = (lineA[0].y + lineA[1].y + lineB[0].y + lineB[1].y)/4;
  let y = parseInt(tmp);
  let tmpp = tmp-y // tmpの小数点以下の値
  if(tmpp>=0.5){ // 切り捨てではなく、四捨五入
    y += 1;
  }
  let x1 = Math.min(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
  let x2 = Math.max(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
  // let new_line = [new cv.Point(x1, y), new cv.Point(x2, y), 0, cnt];
  let new_line = [new cv.Point(x1, y), new cv.Point(x2, y), 0];

  return [new_line, 1];
}

//datas 並べ替えをする配列
function merge_sort(datas) {
 // 要素数
 const COUNT = datas.length;
 // 要素数が 1 以下の場合
 if (COUNT <= 1) {
   return;
 }
 // 中央の添字
 const CENTER = Math.floor(COUNT / 2);
 // 中央で分割した配列
 let leftData = datas.slice(0, CENTER);
 let rightData = datas.slice(CENTER);
 // 各配列のマージソート
 merge_sort(leftData);
 merge_sort(rightData);
 // 結合後の配列
 const mergedData = [];
 // 分割した配列の要素数
 let count1 = leftData.length;
 let count2 = rightData.length;
 
 let i = 0;
 let j = 0;
 
 // 両方の配列に要素がある間
 while (i < count1 && j < count2) {
   //比較する値
   let value1 = leftData[i][1];
   let value2 = rightData[j][1];

   if (value1 <= value2) {
     // value1とvalue2が等しい OR value1 が小さい場合
     mergedData.push(leftData[i]);
     i++;
   } else {
     // value2 が小さい場合
     mergedData.push(rightData[j]);
     j++;
   }
 }
 // leftDataに要素がある間
 while (i < count1) {
   mergedData.push(leftData[i]);
   i++;
 }
 // rightDataに要素がある間
 while (j < count2) {
   mergedData.push(rightData[j]);
   j++;
 }
 // 元の配列にソートした配列を当てはめる。
 for (let i = 0; i < COUNT; i++) {
   datas[i] = mergedData[i];
 }
}


function errorCallback(err) {
  alert(err);
};