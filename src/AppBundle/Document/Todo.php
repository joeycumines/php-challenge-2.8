<?php
/*
 * Models a To do object, owned by a user.
 *
 * A index has been created on userId in the command line tool.
 */

namespace AppBundle\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

/**
 * @MongoDB\Document
 */
class Todo
{
    /**
     * @MongoDB\Id(strategy="auto")
     */
    protected $id;

    /**
     * @MongoDB\Field(type="string")
     */
    protected $userId;

    /**
     * @MongoDB\Field(type="string")
     */
    protected $title;

    /**
     * @MongoDB\Field(type="boolean")
     */
    protected $completed;

    /**
     * Get id
     *
     * @return id $id
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set userId
     *
     * @param string $userId
     * @return $this
     */
    public function setUserId($userId)
    {
        $this->userId = $userId;
        return $this;
    }

    /**
     * Get userId
     *
     * @return string $userId
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * Set title
     *
     * @param string $title
     * @return $this
     */
    public function setTitle($title)
    {
        $this->title = $title;
        return $this;
    }

    /**
     * Get title
     *
     * @return string $title
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Set completed
     *
     * @param boolean $completed
     * @return $this
     */
    public function setCompleted($completed)
    {
        $this->completed = $completed;
        return $this;
    }

    /**
     * Get completed
     *
     * @return boolean $completed
     */
    public function getCompleted()
    {
        return $this->completed;
    }

    /**
     * Gets an array representation of this object.
     *
     * Doesn't include user id since we only use that internally.
     *
     * @return array
     */
    public function serialize(){
        return array('_id'=>$this->id, 'title'=>$this->title, 'completed'=>$this->completed);
    }

}
