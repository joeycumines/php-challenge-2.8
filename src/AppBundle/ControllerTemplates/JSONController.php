<?php
/*
 * Intend to use this to store boilerplate HTTP things to do with manipulating JSON data.
 */

namespace AppBundle\ControllerTemplates;


use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

/**
 * A exception thrown by JSONController.
 *
 * Codes:
 * 0: generic
 * 1: Parser error
 * 2: Unexpected exception
 *
 * Class JSONControllerException
 * @package AppBundle\ControllerTemplates
 */
class JSONControllerException extends \Exception
{
    /**
     * JSONControllerException constructor.
     * @param string|null $message
     * @param int $code
     * @param Exception|null $previous
     */
    public function __construct($message = null, $code = 0, Exception $previous = null) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Custom string representation.
     * @return string
     */
    public function __toString() {
        return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
    }
}

class JSONController extends Controller
{
    /**
     * Get the request body as a JSON object.
     *
     * If it was unable to parse the body (malformed JSON or JSON array, or no body) then a JSONControllerException
     * is thrown.
     *
     * @return array
     * @throws JSONControllerException
     */
    protected function getRequestBody()
    {
        $params = null;
        try {
            $content = $this->get("request")->getContent();
            if (!empty($content)) {
                $params = json_decode($content, true);
            }
        } catch (Exception $e){
            throw new JSONControllerException("Error parsing the request body.", 1, $e);
        }

        if (empty($params))
            throw new JSONControllerException("Unable to parse non existent or empty request body.", 1);

        return $params;
    }
}