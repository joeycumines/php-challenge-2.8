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
     * Gets the ids of all items.
     *
     * @return JsonResponse
     */
    public function getTodoAction()
    {
        //Get all to do for this user
        $todos = $this->dm()->createQueryBuilder('AppBundle:Todo')
            ->field('userId')->equals($this->getUser()->getIdString())
            ->getQuery()->execute();

        //get the _id, title, and completed

        $output = array();
        foreach ($todos as $todo) {
            $temp = array();
            $temp['_id'] = '' . $todo->getId();
            $temp['completed'] = $todo->getCompleted();
            $temp['title'] = $todo->getTitle();
            array_push($output, $temp);
        }

        return new JsonResponse($output);
    }

    /**
     * @Route("/todo", name="delete_todo")
     * @Method({"DELETE"})
     *
     * Deletes all of the existing To do entries for this user.
     *
     * @return JsonResponse
     */
    public function deleteTodoAction()
    {
        $itemsDeleted = 0;
        try {
            $collection = $this->dm()->getDocumentCollection('AppBundle:Todo');
            //The result from the mongodb operation
            $mongoResult = $collection->remove(array('userId' => $this->getUser()->getIdString()));
            if (is_array($mongoResult) && isset($mongoResult['n']))
                $itemsDeleted = intval($mongoResult['n']);
            $this->dm()->flush();
        } catch (Exception $e) {
            return new JsonResponse('' . $e, 500);
        }

        return new JsonResponse('Successfully removed all (' . $itemsDeleted . ') todo items for this user.');
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
    public function postTodoAction(Request $request)
    {
        $body = null;
        try {
            $body = $this->bodyAsJSON($request);
            //If title is unset or null, or isnt a string
            if (!isset($body['title']) || !is_string($body['title']))
                throw new JSONControllerException("Required parameter 'title' was unset or not a string value.");
        } catch (JSONControllerException $e) {
            return new JsonResponse('' . $e, 400);
        }
        //$body isnt null and title is set

        $todo = new Todo();
        $todo->setCompleted(false);
        $todo->setTitle($body['title']);
        $todo->setUserId($this->getUser()->getIdString());

        $this->dm()->persist($todo);
        $this->dm()->flush();

        return new JsonResponse('' . $todo->getId());
    }

    /**
     * @Route("/todo/{id}", name="get_todo_id")
     * @Method({"GET"})
     *
     * Gets a specific item.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function getTodoIdAction($id)
    {
        $item = $this->get('doctrine_mongodb')
            ->getRepository('AppBundle:Todo')
            ->find($id);

        if (!$item) {
            return new JsonResponse('Not Found', 404);
        }

        //if we are forbidden (we are authorized)
        if ($item->getUserId() != $this->getUser()->getIdString()) {
            return new JsonResponse('Forbidden', 403);
        }

        return new JsonResponse($item->serialize());
    }

    /**
     * @Route("/todo/{id}", name="delete_todo_id")
     * @Method({"DELETE"})
     *
     * @param string $id
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteTodoIdAction($id, Request $request)
    {
        $item = $this->get('doctrine_mongodb')
            ->getRepository('AppBundle:Todo')
            ->find($id);

        if (!$item) {
            return new JsonResponse('Not Found', 404);
        }

        //if we are forbidden (we are authorized)
        if ($item->getUserId() != $this->getUser()->getIdString()) {
            return new JsonResponse('Forbidden', 403);
        }

        $this->dm()->remove($item);
        $this->dm()->flush();

        return new JsonResponse('Successfully deleted ' . $id);
    }

    /**
     * @Route("/todo/{id}", name="put_todo_id")
     * @Method({"PUT"})
     *
     * @param string $id
     * @param Request $request
     * @return JsonResponse
     */
    public function putTodoIdAction($id, Request $request)
    {
        $item = $this->get('doctrine_mongodb')
            ->getRepository('AppBundle:Todo')
            ->find($id);

        if (!$item) {
            return new JsonResponse('Not Found', 404);
        }

        //if we are forbidden (we are authorized)
        if ($item->getUserId() != $this->getUser()->getIdString()) {
            return new JsonResponse('Forbidden', 403);
        }

        $body = array();
        try {
            $body = $this->bodyAsJSON($request);
        } catch (JSONControllerException $e) {
            return new JsonResponse('' . $e, 400);
        }

        $title = null;
        $completed = null;

        foreach ($body as $key => $value) {
            if ($key == 'title') {
                if (is_string($value)) {
                    $title = $value;
                    $item->setTitle($title);
                } else
                    return new JsonResponse('Bad Request: The body parameter "title" was not type "string".', 400);

            } else if ($key == 'completed') {
                if (is_bool($value) || is_int($value)) {
                    $completed = ($value === true || $value === 1);
                    $item->setCompleted($completed);
                } else
                    return new JsonResponse('Bad Request: The body parameter "completed" was not type "bool".', 400);
            }
        }

        $this->dm()->flush();

        if ($title == null)
            return new JsonResponse('Successfully set "completed" to ' . ($completed ? 'true' : 'false') . '.');
        if ($completed == null)
            return new JsonResponse('Successfully set "title" to "' . $title . '".');

        return new JsonResponse('Successfully set "title" to "' . $title . '" and "completed" to '
            . ($completed ? 'true' : 'false') . '.');
    }
}