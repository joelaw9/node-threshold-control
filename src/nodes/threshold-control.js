module.exports = function (RED) {
  'use strict'

  function ThresholdControl (config) {
    RED.nodes.createNode(this, config)

    const node = this
    let sendOutput = false
    let countDown = false
    let counter = 0
    let desiredState = 'unknown'
    let State = desiredState
    let fill = 'yellow'

    let onThreshold = config.onThreshold
    let offThreshold = config.offThreshold
    let onDelay = config.onDelay
    let offDelay = config.offDelay

    var intervalId = setInterval(function() {
      if (countDown) {
        if (counter % 2 === 0) {
          node.status({fill: 'yellow', shape: 'dot', text: `Switching in ${counter} sec`})
        } else {
          node.status({fill: 'yellow', shape: 'ring', text: `Switching in ${counter} sec`})
        }
        node.send([null,{
          counter: counter, 
          desiredState: desiredState, 
          onThreshold: onThreshold,
          offThreshold: offThreshold,
          onDelay: onDelay,
          offDelay: offDelay}])
        if (counter > 0 ) {
          counter--
        } else {
          sendOutput = true
        }
        if (sendOutput) {
          node.send({payload: desiredState});
          sendOutput = false
          countDown = false
          if (desiredState === 'on') {
            fill = 'green'
          }
          if (desiredState === 'off') {
            fill = 'red'
          }
          node.status({fill: fill, shape: 'dot', text: `${desiredState}`})
          State = desiredState
        }
      }
    }, 1000);

    node.on('input', function (msg) {

      if (msg.onThreshold && Number(msg.onThreshold)) {
        onThreshold = msg.onThreshold
      }

      if (msg.offThreshold && Number(msg.offThreshold)) {
        offThreshold = msg.offThreshold
      }

      if (msg.onDelay && Number(msg.onDelay)) {
        onDelay = msg.onDelay
      }

      if (msg.offDelay && Number(msg.offDelay)) {
        offDelay = msg.offDelay
      }

      if (msg.payload && !Number(msg.payload)) {
        node.status({fill: 'red', shape: 'dot', text: 'Non-numerical input'})
        return
      }

      if (!onThreshold || !Number(onThreshold)) {
        node.status({ fill: 'red', shape: 'dot', text: 'No or non-mumerical ON threshold set' })
        return
      }

      if (!offThreshold || !Number(offThreshold)) {
        node.status({ fill: 'red', shape: 'dot', text: 'No or non-mumerical OFF threshold set' })
        return
      }

      if (State === 'unknown') {
        if (msg.payload >= onThreshold) {
          State = 'on'
        }
        if (msg.payload <= offThreshold) {
          State = 'off'
        }
        node.status({fill: 'blue', shape: 'dot', text: `${State}`})    

      }

      msg.topic = 'Threshold control'

      if (countDown && desiredState === 'on' && msg.payload < onThreshold) {
        desiredState = State
        countDown = false
        counter = 0
        node.status({fill: fill, shape: 'dot', text: `${desiredState}`})    
      }

      if (countDown && desiredState == 'off' && msg.payload > offThreshold) {
        desiredState = State
        countDown = false
        counter = 0
        node.status({fill: fill, shape: 'dot', text: `${desiredState}`})    
      }

      if (msg.payload >= onThreshold && desiredState !== 'on' && counter === 0) {
        desiredState = 'on'
        counter = onDelay
        countDown = true;
      }

      if (msg.payload <= offThreshold && desiredState !== 'off' && counter === 0) {
        desiredState = 'off'
        counter = offDelay
        countDown = true;
      }
    })

    node.on('close', function () {
      clearInterval(intervalId);
    })

    if (config.verbose) {
      node.warn('verbose')
    }
  }

  RED.nodes.registerType('threshold-control', ThresholdControl)
}