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

    public function testTodoSimple()
    {
        $client = static::createClient();
        $this->doLogin($client);

        //$body = array('title'=>'Todo Test 1');
        //$client->request('POST', '/todo', array(), array(), array(), json_encode($body));

    }
}
