<?php
/**
 * This is a Document class as per http://symfony.com/doc/current/bundles/DoctrineMongoDBBundle/index.html,
 * built on the class provided by http://symfony.com/doc/master/bundles/FOSUserBundle/index.html
 */

namespace AppBundle\Document;

use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

/**
 * @MongoDB\Document
 */
class User extends BaseUser
{
    //Uses native generated object id and represents as string.
    /**
     * @MongoDB\Id(strategy="auto")
     */
    protected $id;

    /**
     * User constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }
}
