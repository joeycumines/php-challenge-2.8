<?php
/*
 * Routes for accessing the To do info.
 *
 * All of these paths are behind the firewall for ROLE_USER.
 *
 * All of these paths consume and send application/json
 */

namespace AppBundle\Controller;

use AppBundle\ControllerTemplates\JSONController;
use AppBundle\ControllerTemplates\JSONControllerException;
use AppBundle\Document\Todo;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class TodoController extends JSONController
{
    /**
     * @Route("/todo", name="get_todo")
     * @Method({"GET"})
     *
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getTodoAction(Request $request){

    }

    /**
     * @Route("/todo", name="post_todo")
     * @Method({"POST"})
     *
     * Creates a new to do, and responds with the ID value (string)
     *
     * @param Request $request
     * @return JsonResponse
     *
     * request
     *  body:
     *      type: object
     *      properties:
     *          title:
     *              type: string
     *              required: true
     *              description: The new to do item. Must not be empty.
     * responses:
     *  200:
     *      OK
     *  400:
     *      Bad Request
     *
     *
     */
    public function postTodoAction(Request $request){
        $body = null;
        try {
            $body = $this->bodyAsJSON($request);
            //If title is unset or null, or isnt a string
            if (!isset($body['title']) || !is_string($body['title']))
                throw new JSONControllerException("Required parameter 'title' was unset or not a string value.");
        } catch (JSONControllerException $e) {
            return new JsonResponse(''.$e, 400);
        }
        //$body isnt null and title is set

        $todo = new Todo();
        $todo->setCompleted(false);
        $todo->setTitle($body['title']);
        $todo->setUserId($this->getUser()->getId());

        $this->dm()->persist($todo);
        $this->dm()->flush();

        return new JsonResponse(''.$todo->getId());
    }

    /**
     * @Route("/todo/{id}", name="get_todo_id")
     * @Method({"POST"})
     *
     * @param string $id
     * @param Request $request
     * @return JsonResponse
     */
    public function getTodoIdAction($id, Request $request){

    }

    /**
     * @Route("/todo/{id}", name="delete_todo_id")
     * @Method({"DELETE"})
     *
     * @param string $id
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteTodoIdAction($id, Request $request){

    }

    /**
     * @Route("/todo/{id}", name="put_todo_id")
     * @Method({"PUT"})
     *
     * @param string $id
     * @param Request $request
     * @return JsonResponse
     */
    public function putTodoIdAction($id, Request $request){

    }
}