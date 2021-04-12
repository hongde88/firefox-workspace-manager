class Util {
  static generateWspName(length) {
    const res = [];
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(let i = 0; i < length; i++) {
      res.push(randomChars.charAt(Math.floor(Math.random() * randomChars.length)));
    };

    return res.join('');
  }
}