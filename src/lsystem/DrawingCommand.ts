class DrawingCommand {
    draw_function: any;
    probability: number;
  
    constructor(func: any, prob: number) {
      this.draw_function = func;
      this.probability = prob;
    }
  
};
  
export default DrawingCommand;