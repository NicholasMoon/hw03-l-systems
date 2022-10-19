class PostCondition {
    new_symbol: string;
    probability: number;
  
    constructor(sym: string, prob: number) {
      this.new_symbol = sym;
      this.probability = prob;
    }
  
};
  
export default PostCondition;