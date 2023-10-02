import chai from 'chai';
import chaiHttp from 'chai-http';
import { index} from 'index.js'; // Import your function
import { expect } from 'chai';

chai.use(chaiHttp);

describe('POST /api/posts', () => {
  it('should create a new post', (done) => {
    // Define the request payload
    const newPost = {
      title: 'New Post',
      content: 'This is the content of the new post.',
    };

    chai
      .request(index) // Use the imported function to make the HTTP request
      .post('/api/posts')
      .send(newPost) // Send the POST request with the payload
      .end((err, res) => {
        expect(res).to.have.status(201); // Assuming 201 is the status code for successful creation
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('message').that.includes('created');
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('title', newPost.title);
        // Add more assertions as needed
        done();
      });
  });
});

export const test = 42;// some exported value or function
