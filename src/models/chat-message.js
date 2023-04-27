export class ChatMessage {

  userid;
  text;

  constructor(userid, text) {
    this.userid = userid;
    this.text = text;
  }


  static fromJSON = (jsonString) => {
    let json = JSON.parse(jsonString);
    return new ChatMessage(json.userid, json.text);
  };
}
