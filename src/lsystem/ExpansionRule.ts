import PostCondition from './PostCondition';


class ExpansionRule {
    precondition: string;
    postconditions: Array<PostCondition>;
  
    constructor(pre: string) {
      this.precondition = pre;
      this.postconditions = new Array();
    }

    addPostConditionWithProb(sym: string, prob: number) {
        this.postconditions.push(new PostCondition(sym, prob));
    }

    addPostCondition(sym: string) {
        this.postconditions.push(new PostCondition(sym, 1));
    }
  
};
  
export default ExpansionRule;