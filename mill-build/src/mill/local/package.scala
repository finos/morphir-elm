package mill

package object local {        
    case class BeforeArgs(toSeq:Seq[String]) extends AnyVal {
        def ++(args:Seq[String]) = BeforeArgs(toSeq ++ args)
        def ++:(args:Seq[String]) = BeforeArgs(args ++ toSeq)
    }
    case class AfterArgs(toSeq:Seq[String]) extends AnyVal{
        def ++(args:Seq[String]) = AfterArgs(toSeq ++ args)
        def ++:(args:Seq[String]) = AfterArgs(args ++ toSeq)
    }
    case class Args(toSeq:Seq[String]) extends AnyVal {
        def ++(args:Seq[String]) = Args(toSeq ++ args)
        def ++:(args:Seq[String]) = Args(args ++ toSeq)
    }
}
