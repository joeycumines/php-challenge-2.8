<?php

namespace AppBundle\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Client;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TodoControllerTest extends WebTestCase
{
    /**
     * Login with FOSUserBundle.
     * @param $client
     * @param $username
     * @param $password
     */
    public function doLogin(Client $client, $username = "testaccount", $password = "testaccount") {
        $crawler = $client->request('GET', '/login');
        $form = $crawler->selectButton('_submit')->form(array(
            '_username'  => $username,
            '_password'  => $password,
        ));
        $client->submit($form);

        //echo $client->getResponse();

        $this->assertTrue($client->getResponse()->isRedirect());

        $crawler = $client->followRedirect();

        //echo $client->getResponse();
    }

    /**
     * Get the response body as a JSON object.
     *
     * If it was unable to parse the body (malformed JSON or JSON array, or no body) it returns a string.
     *
     * @param Client $client
     * @return array|string
     */
    public function responseAsJSON($client)
    {
        $result = '';
        $content = $client->getResponse()->getContent();
        try {
            if (!empty($content)) {
                $result = json_decode($content, true);
            }
        } catch (\Exception $e) {
            $result = $content;
        }
        return $result;
    }

    public function testTodoSimple()
    {
        $client = static::createClient();
        $this->doLogin($client);

        //Delete all to do items for this user
        $crawler = $client->request('DELETE', '/todo');
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        //Add a bunch of test items
        $body = array('title' => 'Todo Test 1');
        $crawler = $client->request('POST', '/todo', array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $id1 = $this->responseAsJSON($client);

        $body = array('title' => 'Todo Test 2');
        $crawler = $client->request('POST', '/todo', array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $id2 = $this->responseAsJSON($client);

        $body = array('title' => 'Todo Test 3');
        $crawler = $client->request('POST', '/todo', array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $id3 = $this->responseAsJSON($client);

        //Get all the current to do items
        $crawler = $client->request('GET', '/todo');
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $items = $this->responseAsJSON($client);
        $this->assertEquals(3, count($items));
        $this->assertEquals($id1, $items[0]);
        $this->assertEquals($id2, $items[1]);
        $this->assertEquals($id3, $items[2]);
        unset($items);

        //Try getting each specific item
        $crawler = $client->request('GET', '/todo/' . $id1);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $item = $this->responseAsJSON($client);
        $this->assertEquals($id1, $item['_id']);
        $this->assertEquals(false, $item['completed']);
        $this->assertEquals('Todo Test 1', $item['title']);

        $crawler = $client->request('GET', '/todo/' . $id2);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $item = $this->responseAsJSON($client);
        $this->assertEquals($id2, $item['_id']);
        $this->assertEquals(false, $item['completed']);
        $this->assertEquals('Todo Test 2', $item['title']);

        $crawler = $client->request('GET', '/todo/' . $id3);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $item = $this->responseAsJSON($client);
        $this->assertEquals($id3, $item['_id']);
        $this->assertEquals(false, $item['completed']);
        $this->assertEquals('Todo Test 3', $item['title']);

        //lets work with $id1
        //set the title
        $body = array();
        $body['title'] = 'New Title';
        $crawler = $client->request('PUT', '/todo/' . $id1, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        //Set completed to true
        $body = array();
        $body['completed'] = true;
        $crawler = $client->request('PUT', '/todo/' . $id1, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        //Do some PUT requests that will fail with 400
        //No params
        $body = array();
        $crawler = $client->request('PUT', '/todo/' . $id3, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(400, $client->getResponse()->getStatusCode());
        //invalid title (integer)
        $body = array();
        $body['title'] = 21129;
        $crawler = $client->request('PUT', '/todo/' . $id3, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(400, $client->getResponse()->getStatusCode());
        //invalid completed (string)
        $body = array();
        $body['completed'] = 'completed is true';
        $crawler = $client->request('PUT', '/todo/' . $id3, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(400, $client->getResponse()->getStatusCode());

        //Delete item 2
        $crawler = $client->request('DELETE', '/todo/' . $id2);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        //Try to delete it again (404)
        $crawler = $client->request('DELETE', '/todo/' . $id2);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(404, $client->getResponse()->getStatusCode());

        //Try to set the title on $id2 (404)
        $body = array();
        $body['title'] = 'New Title 2';
        $crawler = $client->request('PUT', '/todo/' . $id2, array(), array(), array(), json_encode($body));
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(404, $client->getResponse()->getStatusCode());

        //Check the result of GET /id again
        $crawler = $client->request('GET', '/todo');
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $items = $this->responseAsJSON($client);
        $this->assertEquals(2, count($items));
        $this->assertEquals($id1, $items[0]);
        $this->assertEquals($id3, $items[1]);
        unset($items);

        //assert the values and responses from a GET to each item
        $crawler = $client->request('GET', '/todo/' . $id1);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $item = $this->responseAsJSON($client);
        $this->assertEquals($id1, $item['_id']);
        $this->assertEquals(true, $item['completed']);
        $this->assertEquals('New Title', $item['title']);

        $crawler = $client->request('GET', '/todo/' . $id2);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(404, $client->getResponse()->getStatusCode());

        $crawler = $client->request('GET', '/todo/' . $id3);
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $item = $this->responseAsJSON($client);
        $this->assertEquals($id3, $item['_id']);
        $this->assertEquals(false, $item['completed']);
        $this->assertEquals('Todo Test 3', $item['title']);

        //Delete them all
        $crawler = $client->request('DELETE', '/todo');
        echo $client->getResponse();
        echo("\n\n");
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
    }
}
