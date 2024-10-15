// gameScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BALL_SIZE = 20;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 20;

const GameScreen = () => {
  const [ballPosition, setBallPosition] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });
  const [ballDirection, setBallDirection] = useState({ x: 3, y: -3 });
  const [paddlePosition, setPaddlePosition] = useState(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [bricks, setBricks] = useState(generateBricks());

  // 공의 움직임 처리
  useEffect(() => {
    const interval = setInterval(() => {
      moveBall();
    }, 16);
    return () => clearInterval(interval);
  }, [ballPosition]);

  const moveBall = () => {
    let { x, y } = ballPosition;
    let { x: dx, y: dy } = ballDirection;

    // 벽에 부딪혔을 때 반사 처리
    if (x <= 0 || x >= SCREEN_WIDTH - BALL_SIZE) dx = -dx;
    if (y <= 0) dy = -dy;

    // 바닥에 닿으면 게임 오버, 이걸 추가할 수 있음

    // 바에 부딪혔을 때 반사 처리
    if (y + BALL_SIZE >= SCREEN_HEIGHT - PADDLE_HEIGHT && x > paddlePosition && x < paddlePosition + PADDLE_WIDTH) {
      dy = -dy;
    }

    // 벽돌에 부딪혔을 때 벽돌 제거 및 반사 처리
    const collidedBrickIndex = bricks.findIndex(
      (brick) =>
        x + BALL_SIZE >= brick.x &&
        x <= brick.x + BRICK_WIDTH &&
        y + BALL_SIZE >= brick.y &&
        y <= brick.y + BRICK_HEIGHT
    );

    if (collidedBrickIndex !== -1) {
      dy = -dy;
      const updatedBricks = [...bricks];
      updatedBricks.splice(collidedBrickIndex, 1);
      setBricks(updatedBricks);
    }

    setBallPosition({ x: x + dx, y: y + dy });
    setBallDirection({ x: dx, y: dy });
  };

  // 사용자가 바를 움직일 수 있도록 터치 이벤트 처리
  const movePaddle = (e) => {
    setPaddlePosition(e.nativeEvent.locationX - PADDLE_WIDTH / 2);
  };

  return (
    <TouchableWithoutFeedback onPress={movePaddle}>
      <View style={styles.container}>
        {/* 공 */}
        <View
          style={[
            styles.ball,
            { top: ballPosition.y, left: ballPosition.x },
          ]}
        />
        {/* 바 */}
        <View
          style={[styles.paddle, { left: paddlePosition }]}
        />
        {/* 벽돌들 */}
        {bricks.map((brick, index) => (
          <View key={index} style={[styles.brick, { top: brick.y, left: brick.x }]} />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

// 벽돌 초기 생성
const generateBricks = () => {
  const bricks = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      bricks.push({
        x: j * (BRICK_WIDTH + 10) + 30,
        y: i * (BRICK_HEIGHT + 10) + 50,
      });
    }
  }
  return bricks;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: 'white',
    position: 'absolute',
  },
  paddle: {
    position: 'absolute',
    bottom: 10,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    backgroundColor: 'white',
  },
  brick: {
    position: 'absolute',
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    backgroundColor: 'red',
  },
});

export default GameScreen;
