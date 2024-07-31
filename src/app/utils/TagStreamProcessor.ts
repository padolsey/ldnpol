interface ProcessOptions {
  discardAfterEndTag?: boolean;
}

interface ProcessResult {
  throwable?: Error;
}

export default class TagStreamProcessor {
  private startTag: string;
  private placeholder: string;
  private startTagProspect: string;
  private endTag: string;
  private process: (contents: string) => Promise<string | ProcessResult>;
  private buffer: string;
  private tagOpen: boolean;
  private discardAfterEndTag: boolean;

  constructor(
    startTagProspect: string,
    startTag: string,
    endTag: string,
    placeholder: string,
    processFn: (contents: string) => Promise<string | ProcessResult>,
    options: ProcessOptions = {}
  ) {
    this.startTag = startTag;
    this.placeholder = placeholder;
    this.startTagProspect = startTagProspect;
    this.endTag = endTag;
    this.process = processFn;
    this.buffer = '';
    this.tagOpen = false;
    this.discardAfterEndTag = options.discardAfterEndTag || false;
  }

  async next(chunk: string): Promise<string> {
    this.buffer += chunk;
    let output = '';

    while (true) {
      if (!this.tagOpen) {
        let startTagIndex = this.buffer.indexOf(this.startTag);
        
        if (startTagIndex === -1) {
          let possibleStartTagIndex = this.buffer.indexOf(this.startTagProspect);
          if (possibleStartTagIndex === -1) {
            output += this.buffer;
            this.buffer = '';
          } else {
            output += this.buffer.slice(0, possibleStartTagIndex);
            this.buffer = this.buffer.slice(possibleStartTagIndex);
          }
          break;
        } else {
          output += this.buffer.slice(0, startTagIndex);
          this.buffer = this.buffer.slice(startTagIndex);
          this.tagOpen = true;
        }
      } else {
        let endTagIndex = this.buffer.indexOf(this.endTag);
        if (endTagIndex === -1) {
          output += this.placeholder;
          break;
        } else {
          let contents = this.buffer.slice(this.startTag.length, endTagIndex);
          let evaluated = await this.process(contents);
          if (typeof evaluated !== 'string' && evaluated?.throwable) {
            throw evaluated.throwable;
          }
          output += evaluated;
          
          if (this.discardAfterEndTag) {
            this.buffer = '';
          } else {
            this.buffer = this.buffer.slice(endTagIndex + this.endTag.length);
          }
          
          this.tagOpen = false;
        }
      }
    }
    return output;
  }
}