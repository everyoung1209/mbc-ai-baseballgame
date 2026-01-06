
export const generateTargetNumber = (length: number = 4): string => {
  const digits = Array.from({ length: 10 }, (_, i) => i.toString());
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result += digits.splice(randomIndex, 1)[0];
  }
  return result;
};

export const calculateResult = (target: string, guess: string) => {
  let strikes = 0;
  let balls = 0;

  const targetArr = target.split('');
  const guessArr = guess.split('');

  guessArr.forEach((digit, index) => {
    if (digit === targetArr[index]) {
      strikes++;
    } else if (targetArr.includes(digit)) {
      balls++;
    }
  });

  return { strikes, balls };
};
