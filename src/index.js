import React from 'react'
import ReactDOM from 'react-dom'

import useModel from './useModel'
import ObjectDetectionVideo from './object-detection-video/ObjectDetectionVideo'

import './index.css'

const THRESH = 0.6;

const weight = (x, bias) => {
  if (bias < 0)
    return x;
  return x + 1000;
}

const sort = (buffer, avgHeight) => {
  let minY = Math.max.apply(Math, buffer.map(v => v[1]));
  let line_thresh = minY + (avgHeight * 3 / 4);

  buffer.sort(function (a, b) {
    return weight(a[1], (line_thresh - a[2])) - weight(b[1], (line_thresh - b[2]));
  })

  return buffer.reduce((buff, curr) => { return buff + curr[0] }, '')
}

const getNumber = async (model, canvasRef) => {
  if (!model) {
    console.log("Model is undefined.");
    return;
  }
  const predictions = await model.detect(canvasRef.current)
  let buffer = [];
  let heights = [];
  predictions.forEach(letter => {
    if (letter.score > THRESH) {
      let ch = letter.class;
      let x = letter.bbox[0];
      let yMin = letter.bbox[1];
      let yMax = letter.bbox[3];
      heights.push(yMax - yMin)
      buffer.push([ch, x, yMin])
      // console.log(letter)
    }
  });
  let avg_height = heights / heights.length;
  console.log('Sorted', sort(buffer, avg_height))
  console.log('Array', buffer);
}


const handlePrediction = (predictions, videoRef, canvasRef, model) => {
  // console.timeEnd('detect')
  // console.time('detect')
  // console.log(predictions)
  predictions.forEach(prediction => {
    // console.log(prediction.class);
    if (prediction.class === 'Numberplate') {
      // console.log(videoRef);
      // console.log(canvasRef);

      const ctx = canvasRef.current.getContext('2d')
      // const width = prediction.bbox[2]
      // const height = prediction.bbox[3]
      ctx.clearRect(0, 0, '100%', '100%')
      // canvasRef.current.style.width = width
      // canvasRef.current.style.height = width
      ctx.drawImage(videoRef.current, ...prediction.bbox, 0, 0, 300, 150)

      getNumber(model, canvasRef)

      // videoRef.current.pause();
      // videoRef.current.style.width = '100px'
      // videoRef.current.style.height = '100px'

      return true;
    }
  });

}

const render = (ctx, predictions) => {
  // predictions.forEach((prediction) => {
  //   const x = prediction.bbox[0]
  //   const y = prediction.bbox[1]
  //   const width = prediction.bbox[2]
  //   const height = prediction.bbox[3]



  //   ctx.setStrokeStyle('#00ff00')
  //   ctx.setLineWidth(4)
  //   ctx.strokeRect(
  //     Math.round(x),
  //     Math.round(y),
  //     Math.round(width),
  //     Math.round(height)
  //   )
  // })
}

const App = () => {
  const model = useModel(process.env.PUBLIC_URL + '/model_detection')
  const model2 = useModel(process.env.PUBLIC_URL + '/model_web')

  console.log('model1', model)
  console.log('model2', model2)

  return (
    <div className="fillPage">
      <ObjectDetectionVideo
        model={model}
        model2={model2}
        onPrediction={handlePrediction}
        render={render}
        // aspectFill: The option to scale the video to fill the size of the view.
        //             Some portion of the video may be clipped to fill the view's
        //             bounds.
        // aspectFit:  The option to scale the video to fit the size of the view
        //             by maintaining the aspect ratio. Any remaining area of the
        //             view's bounds is transparent.
        // fit="aspectFill"
        // mirrored:   mirror the video about its vertical axis.
        mirrored
      />
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
