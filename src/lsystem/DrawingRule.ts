import DrawingCommand from './DrawingCommand';

class DrawingRule {
  symbol: string;
  drawing_commands: Array<DrawingCommand>;

  constructor(sym: string, func: any, prob: number) {
    this.symbol = sym;
    this.drawing_commands = new Array();
    this.addDrawingCommandWithProb(func, prob);
  }

  addDrawingCommandWithProb(func: any, prob: number) {
      this.drawing_commands.push(new DrawingCommand(func, prob));
  }

  addDrawingCommand(func: any) {
      this.drawing_commands.push(new DrawingCommand(func, 1));
  }
  
};
  
export default DrawingRule;